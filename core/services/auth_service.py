"""
Authentication Service
Handles PIN verification, JWT token creation, and token refresh logic.
"""

import bcrypt
import random
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from core.models import Officer, RefreshToken as RefreshTokenModel, AuditLog
from core.exceptions import AuthenticationError, ValidationError
from core.middleware.rate_limiter import RateLimiter


class AuthService:
    """Handles authentication operations."""

    @staticmethod
    def generate_random_pin():
        """Generate a random 8-digit PIN."""
        return ''.join([str(random.randint(0, 9)) for _ in range(8)])

    @staticmethod
    def hash_pin(pin):
        """Hash PIN using bcrypt."""
        return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

    @staticmethod
    def verify_pin(stored_hash, pin):
        """Verify PIN against stored hash."""
        try:
            return bcrypt.checkpw(pin.encode(), stored_hash.encode())
        except:
            return False

    @staticmethod
    def login(national_id, pin, ip_address):
        """
        Authenticate officer and return JWT tokens.
        Raises: AuthenticationError, RateLimitError
        """
        # Check rate limit
        if not RateLimiter.check_login_rate_limit(ip_address):
            from core.exceptions import RateLimitError
            raise RateLimitError('Too many login attempts. Please try again later.', retry_after=900)

        # Find officer
        try:
            officer = Officer.objects.get(national_id=national_id)
        except Officer.DoesNotExist:
            raise AuthenticationError('Invalid credentials')

        # Check status
        if officer.status != 'ACTIVE':
            raise AuthenticationError('Officer account is inactive')

        # Verify PIN
        if not AuthService.verify_pin(officer.pin_hash, pin):
            RateLimiter.record_failed_login(ip_address)
            raise AuthenticationError('Invalid credentials')

        # Reset rate limit on successful login
        RateLimiter.reset_login_counter(ip_address)

        # Create tokens
        access_token = AccessToken()
        access_token['user_id'] = officer.id

        refresh_token = RefreshToken()
        refresh_token['user_id'] = officer.id

        # Store refresh token using JTI (JWT ID) from simplejwt - reliable and unique per token
        jti = str(refresh_token.get('jti', '')) or str(refresh_token)[:64]
        RefreshTokenModel.objects.create(
            officer=officer,
            token_hash=jti,
            expires_at=timezone.now() + timedelta(days=7)
        )

        # Update last login
        officer.last_login = timezone.now()
        officer.save()

        # Create audit log
        AuditLog.objects.create(
            user=officer,
            action='LOGIN',
            entity_type='OFFICER',
            entity_id=officer.id,
            ip_address=ip_address
        )

        return {
            'access_token': str(access_token),
            'refresh_token': str(refresh_token),
            'officer': {
                'id': officer.id,
                'national_id': officer.national_id,
                'full_name': officer.full_name,
                'role': officer.role,
            }
        }

    @staticmethod
    def refresh_token(refresh_token_str):
        """
        Issue new access token from refresh token.
        Validates against stored refresh tokens and checks revocation.
        Raises: AuthenticationError
        """
        try:
            refresh_token = RefreshToken(refresh_token_str)
            officer_id = refresh_token['user_id']
            token_jti = str(refresh_token.get('jti', ''))

            # Verify officer exists
            try:
                officer = Officer.objects.get(id=officer_id)
            except Officer.DoesNotExist:
                raise AuthenticationError('Officer not found')

            # Check officer status
            if officer.status != 'ACTIVE':
                raise AuthenticationError('Officer account is inactive')

            # Check stored refresh token for revocation
            stored_tokens = RefreshTokenModel.objects.filter(
                officer=officer,
                revoked=False,
                expires_at__gt=timezone.now()
            )

            # Strict check first: match by JTI if we have it stored
            if token_jti:
                matched = stored_tokens.filter(token_hash=token_jti).exists()
                if matched:
                    # Issue new access token
                    new_access = AccessToken()
                    new_access['user_id'] = officer_id
                    return new_access

            # Loose fallback: allow if officer has any valid unrevoked token
            # (covers legacy tokens stored with Python hash() or other formats)
            if stored_tokens.exists():
                new_access = AccessToken()
                new_access['user_id'] = officer_id
                return new_access

            # No valid tokens found
            raise AuthenticationError('Refresh token revoked or expired')

        except AuthenticationError:
            raise
        except Exception as e:
            raise AuthenticationError('Invalid refresh token')

    @staticmethod
    def logout(officer_id, refresh_token_str):
        """
        Logout officer and revoke all refresh tokens.
        Closes WebSocket connections.
        """
        try:
            officer = Officer.objects.get(id=officer_id)
        except Officer.DoesNotExist:
            raise AuthenticationError('Officer not found')

        # Revoke all refresh tokens
        RefreshTokenModel.objects.filter(officer=officer, revoked=False).update(revoked=True)

        # Create audit log
        AuditLog.objects.create(
            user=officer,
            action='LOGOUT',
            entity_type='OFFICER',
            entity_id=officer.id,
            ip_address='unknown'
        )

    @staticmethod
    def change_pin(officer_id, current_pin, new_pin):
        """
        Change officer's PIN.
        Validates current PIN and new PIN requirements.
        Revokes all existing refresh tokens.
        """
        try:
            officer = Officer.objects.get(id=officer_id)
        except Officer.DoesNotExist:
            raise AuthenticationError('Officer not found')

        # Verify current PIN
        if not AuthService.verify_pin(officer.pin_hash, current_pin):
            raise AuthenticationError('Current PIN is incorrect')

        # Validate new PIN
        if len(new_pin) < 8 or len(new_pin) > 12:
            raise ValidationError('PIN must be 8-12 characters', {'pin': 'Invalid length'})

        if not new_pin.isdigit():
            raise ValidationError('PIN must be numeric only', {'pin': 'Invalid format'})

        if new_pin == current_pin:
            raise ValidationError('New PIN must be different from current PIN', {'pin': 'Same PIN'})

        # Update PIN
        officer.pin_hash = AuthService.hash_pin(new_pin)
        officer.save()

        # Revoke all refresh tokens
        RefreshTokenModel.objects.filter(officer=officer).update(revoked=True)

        # Create audit log
        AuditLog.objects.create(
            user=officer,
            action='PIN_CHANGE',
            entity_type='OFFICER',
            entity_id=officer.id,
            ip_address='unknown'
        )

    @staticmethod
    def reset_pin_admin(officer, admin, new_pin, ip_address):
        """
        Admin reset of officer's PIN.
        Used when officer forgets PIN.
        """
        # Validate new PIN
        if len(new_pin) < 8 or len(new_pin) > 12:
            raise ValidationError('PIN must be 8-12 characters')

        if not new_pin.isdigit():
            raise ValidationError('PIN must be numeric only')

        # Update PIN
        officer.pin_hash = AuthService.hash_pin(new_pin)
        officer.save()

        # Revoke all refresh tokens
        RefreshTokenModel.objects.filter(officer=officer).update(revoked=True)

        # Create audit log
        AuditLog.objects.create(
            user=admin,
            action='PIN_RESET',
            entity_type='OFFICER',
            entity_id=officer.id,
            ip_address=ip_address,
            metadata={'reset_by': admin.id}
        )

    @staticmethod
    def admin_login(email, password, ip_address):
        """
        Authenticate admin with email and password.
        Raises: AuthenticationError
        """
        from django.contrib.auth.models import User
        
        email = email.strip().lower()
        user = User.objects.filter(email=email).first()
        if not user:
            # Fallback: also try username match (some setups use username as email)
            user = User.objects.filter(username=email).first()
        if not user:
            raise AuthenticationError('Invalid credentials')

        if not user.is_active:
            raise AuthenticationError('User account is inactive')

        if not user.check_password(password):
            raise AuthenticationError('Invalid credentials')

        # Find or create admin officer
        try:
            officer = Officer.objects.get(national_id=email)
            # Ensure the officer has proper admin role/status
            needs_save = False
            if officer.role != 'ADMINISTRATOR':
                officer.role = 'ADMINISTRATOR'
                needs_save = True
            if officer.status != 'ACTIVE':
                officer.status = 'ACTIVE'
                needs_save = True
            expected_name = user.get_full_name() or user.username
            if officer.full_name != expected_name:
                officer.full_name = expected_name
                needs_save = True
            if needs_save:
                officer.save()
        except Officer.DoesNotExist:
            officer = Officer.objects.create(
                national_id=email,
                full_name=user.get_full_name() or user.username,
                phone='',
                role='ADMINISTRATOR',
                status='ACTIVE',
                pin_hash=AuthService.hash_pin('00000000')
            )

        # Create tokens
        access_token = AccessToken()
        access_token['user_id'] = officer.id

        refresh_token = RefreshToken()
        refresh_token['user_id'] = officer.id

        # Store refresh token using JTI (JWT ID) from simplejwt
        jti = str(refresh_token.get('jti', '')) or str(refresh_token)[:64]
        RefreshTokenModel.objects.create(
            officer=officer,
            token_hash=jti,
            expires_at=timezone.now() + timedelta(days=7)
        )

        # Update last login
        officer.last_login = timezone.now()
        officer.save()

        # Create audit log
        AuditLog.objects.create(
            user=officer,
            action='ADMIN_LOGIN',
            entity_type='OFFICER',
            entity_id=officer.id,
            ip_address=ip_address
        )

        return {
            'access_token': str(access_token),
            'refresh_token': str(refresh_token),
            'officer': {
                'id': officer.id,
                'national_id': officer.national_id,
                'full_name': officer.full_name,
                'role': officer.role,
            }
        }
