"""
Officer Management Service
Handles officer CRUD operations, status management, and PIN resets.
"""

from django.db import transaction
from django.utils import timezone
from core.models import Officer, RefreshToken as RefreshTokenModel, AuditLog, OfficerAssignedLocation
from core.exceptions import ValidationError, ConflictError, NotFoundError, AuthenticationError
from core.services.auth_service import AuthService


class OfficerService:
    """Handles officer management operations."""

    @staticmethod
    def create_officer(national_id, full_name, phone, role, assigned_locations, admin_officer):
        """
        Create new officer with assigned locations.
        Generates random PIN and sends via SMS.
        
        Args:
            national_id: Officer's national ID
            full_name: Officer's full name
            phone: Officer's phone number
            role: Officer's role (REGISTRATION_OFFICER, SUPERVISOR, ADMINISTRATOR)
            assigned_locations: List of location dicts {county, district, division, location}
            admin_officer: Officer performing the action (for audit log)
        
        Returns:
            Created Officer instance
            
        Raises:
            ConflictError: If national_id already exists
            ValidationError: If input validation fails
        """
        # Validate national_id uniqueness
        if Officer.objects.filter(national_id=national_id).exists():
            raise ConflictError('Officer with this national_id already exists')

        # Validate phone format (basic Kenyan format check)
        if not OfficerService.validate_phone_number(phone):
            raise ValidationError('Invalid phone number format', {'phone': 'Must be valid Kenyan number'})

        # Generate random PIN
        pin = AuthService.generate_random_pin()
        pin_hash = AuthService.hash_pin(pin)

        try:
            with transaction.atomic():
                # Create officer
                officer = Officer.objects.create(
                    national_id=national_id,
                    full_name=full_name,
                    phone=phone,
                    role=role,
                    pin_hash=pin_hash,
                    status='ACTIVE'
                )

                # Create assigned locations
                for location in assigned_locations:
                    OfficerAssignedLocation.objects.create(
                        officer=officer,
                        county=location.get('county'),
                        district=location.get('district'),
                        division=location.get('division'),
                        location=location.get('location')
                    )

                # Create audit log
                AuditLog.objects.create(
                    user=admin_officer,
                    action='OFFICER_CREATE',
                    entity_type='OFFICER',
                    entity_id=officer.id,
                    metadata={'national_id': national_id, 'phone': phone, 'role': role}
                )

                # TODO: Queue SMS with PIN via Celery
                # send_officer_pin_sms.delay(phone, pin)

                return officer

        except Exception as e:
            raise ValidationError(f'Failed to create officer: {str(e)}')

    @staticmethod
    def list_officers(status=None, assigned_location=None, page=1, page_size=25):
        """
        List officers with optional filtering.
        
        Args:
            status: Filter by status (ACTIVE, INACTIVE, SUSPENDED)
            assigned_location: Filter by location
            page: Page number
            page_size: Results per page
            
        Returns:
            Queryset of officers with annotations
        """
        queryset = Officer.objects.select_related().prefetch_related('assigned_locations', 'refresh_tokens')

        if status:
            queryset = queryset.filter(status=status)

        if assigned_location:
            queryset = queryset.filter(assigned_locations__location=assigned_location)

        return queryset

    @staticmethod
    def get_officer(officer_id):
        """
        Get officer by ID with full details.
        
        Raises:
            NotFoundError: If officer not found
        """
        try:
            return Officer.objects.select_related().prefetch_related(
                'assigned_locations'
            ).get(id=officer_id)
        except Officer.DoesNotExist:
            raise NotFoundError('Officer not found')

    @staticmethod
    def update_status(officer_id, new_status, admin_officer):
        """
        Update officer status and revoke tokens if deactivating.
        
        Args:
            officer_id: Officer to update
            new_status: New status (ACTIVE, INACTIVE, SUSPENDED)
            admin_officer: Officer performing the action
            
        Returns:
            Updated Officer instance
            
        Raises:
            NotFoundError: If officer not found
        """
        try:
            officer = Officer.objects.get(id=officer_id)
        except Officer.DoesNotExist:
            raise NotFoundError('Officer not found')

        old_status = officer.status
        officer.status = new_status
        officer.save()

        # Revoke all refresh tokens if deactivating
        if new_status in ['INACTIVE', 'SUSPENDED']:
            RefreshTokenModel.objects.filter(officer=officer, revoked=False).update(revoked=True)
            # TODO: Close WebSocket connections for officer

        # Create audit log
        AuditLog.objects.create(
            user=admin_officer,
            action='OFFICER_DEACTIVATE',
            entity_type='OFFICER',
            entity_id=officer.id,
            metadata={'old_status': old_status, 'new_status': new_status}
        )

        return officer

    @staticmethod
    def reset_pin_admin(officer_id, admin_officer, ip_address='unknown'):
        """
        Admin reset of officer's PIN.
        
        Args:
            officer_id: Officer whose PIN to reset
            admin_officer: Officer performing the reset
            ip_address: IP address for audit log
            
        Returns:
            New PIN (for sending via SMS)
            
        Raises:
            NotFoundError: If officer not found
        """
        try:
            officer = Officer.objects.get(id=officer_id)
        except Officer.DoesNotExist:
            raise NotFoundError('Officer not found')

        # Generate new PIN
        new_pin = AuthService.generate_random_pin()
        pin_hash = AuthService.hash_pin(new_pin)

        # Update officer
        officer.pin_hash = pin_hash
        officer.save()

        # Revoke all refresh tokens
        RefreshTokenModel.objects.filter(officer=officer).update(revoked=True)

        # Create audit log
        AuditLog.objects.create(
            user=admin_officer,
            action='PIN_RESET',
            entity_type='OFFICER',
            entity_id=officer.id,
            ip_address=ip_address,
            metadata={'reset_by': admin_officer.id, 'phone': officer.phone}
        )

        # TODO: Queue SMS with new PIN
        # send_officer_pin_sms.delay(officer.phone, new_pin)

        return new_pin

    @staticmethod
    def validate_phone_number(phone):
        """
        Validate Kenyan phone number format.
        Accepts: +254..., 0...
        """
        if not phone:
            return False
        
        phone = str(phone).strip()
        
        # +254 format
        if phone.startswith('+254'):
            return len(phone) == 13 and phone[4:].isdigit()
        
        # 0 format
        if phone.startswith('0'):
            return len(phone) == 10 and phone[1:].isdigit()
        
        return False
