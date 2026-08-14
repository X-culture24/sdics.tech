"""
Unit tests for authentication service and endpoints.
Tests login, token refresh, logout, and PIN change functionality.
"""

from django.test import TestCase, Client
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from datetime import timedelta
import json

from core.models import Officer, RefreshToken, AuditLog
from core.services.auth_service import AuthService
from core.utils import hash_pin, verify_pin
from core.exceptions import AuthenticationError, ValidationError as ServiceValidationError


class AuthServiceLoginTests(TestCase):
    """Tests for AuthService.login() method."""

    def setUp(self):
        """Set up test fixtures."""
        # Create a test officer with known credentials
        self.test_pin = "12345678"
        self.pin_hash = hash_pin(self.test_pin)
        
        self.officer = Officer.objects.create(
            national_id="12345678",
            full_name="Test Officer",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )
        
        self.ip_address = "192.168.1.1"

    def test_login_with_valid_credentials(self):
        """
        Test login with valid national_id and PIN.
        **Validates: Requirements 1.1, 1.2**
        """
        result = AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        
        # Verify tokens are returned
        self.assertIn('access_token', result)
        self.assertIn('refresh_token', result)
        self.assertIn('officer', result)
        
        # Verify officer data
        self.assertEqual(result['officer']['id'], self.officer.id)
        self.assertEqual(result['officer']['national_id'], self.officer.national_id)
        self.assertEqual(result['officer']['full_name'], self.officer.full_name)
        self.assertEqual(result['officer']['role'], self.officer.role)
        
        # Verify tokens are non-empty strings
        self.assertIsInstance(result['access_token'], str)
        self.assertIsInstance(result['refresh_token'], str)
        self.assertTrue(len(result['access_token']) > 0)
        self.assertTrue(len(result['refresh_token']) > 0)

    def test_login_with_invalid_pin(self):
        """
        Test login with invalid PIN.
        **Validates: Requirements 1.3**
        """
        with self.assertRaises(AuthenticationError) as context:
            AuthService.login(self.officer.national_id, "wrongpin", self.ip_address)
        
        self.assertIn("Invalid credentials", str(context.exception))

    def test_login_with_nonexistent_national_id(self):
        """
        Test login with non-existent national_id.
        **Validates: Requirements 1.3**
        """
        with self.assertRaises(AuthenticationError) as context:
            AuthService.login("99999999", self.test_pin, self.ip_address)
        
        self.assertIn("Invalid credentials", str(context.exception))

    def test_login_with_inactive_officer(self):
        """
        Test login with inactive officer account.
        **Validates: Requirements 5.4**
        """
        self.officer.status = 'INACTIVE'
        self.officer.save()
        
        with self.assertRaises(AuthenticationError) as context:
            AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        
        self.assertIn("inactive", str(context.exception).lower())

    def test_login_creates_refresh_token_record(self):
        """
        Test that successful login creates RefreshToken record in database.
        **Validates: Requirements 1.5**
        """
        AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        
        # Verify RefreshToken record was created
        refresh_tokens = RefreshToken.objects.filter(officer=self.officer, revoked=False)
        self.assertEqual(refresh_tokens.count(), 1)
        
        # Verify token properties
        token = refresh_tokens.first()
        self.assertIsNotNone(token.expires_at)
        self.assertFalse(token.revoked)

    def test_login_creates_audit_log(self):
        """
        Test that successful login creates AuditLog entry.
        **Validates: Requirements 17.5**
        """
        AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        
        # Verify AuditLog entry
        audit_logs = AuditLog.objects.filter(user=self.officer, action='LOGIN')
        self.assertEqual(audit_logs.count(), 1)
        
        log = audit_logs.first()
        self.assertEqual(log.entity_type, 'OFFICER')
        self.assertEqual(log.entity_id, self.officer.id)
        self.assertEqual(log.ip_address, self.ip_address)

    def test_login_updates_last_login(self):
        """
        Test that login updates officer's last_login timestamp.
        **Validates: Requirements 1.1**
        """
        before_login = timezone.now()
        AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        after_login = timezone.now()
        
        # Refresh officer from database
        self.officer.refresh_from_db()
        
        # Verify last_login is set and within timeframe
        self.assertIsNotNone(self.officer.last_login)
        self.assertGreaterEqual(self.officer.last_login, before_login)
        self.assertLessEqual(self.officer.last_login, after_login)

    def test_login_error_does_not_expose_which_field_failed(self):
        """
        Test that login error message doesn't reveal whether ID or PIN is wrong.
        **Validates: Requirements 1.3**
        """
        # Try with invalid PIN
        with self.assertRaises(AuthenticationError) as context1:
            AuthService.login(self.officer.national_id, "wrongpin", self.ip_address)
        
        # Try with invalid national_id
        with self.assertRaises(AuthenticationError) as context2:
            AuthService.login("99999999", self.test_pin, self.ip_address)
        
        # Both should return the same generic error message
        self.assertEqual(str(context1.exception), str(context2.exception))


class TokenRefreshTests(TestCase):
    """Tests for AuthService.refresh_token() method."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_pin = "12345678"
        self.pin_hash = hash_pin(self.test_pin)
        
        self.officer = Officer.objects.create(
            national_id="87654321",
            full_name="Test Officer 2",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )
        
        self.ip_address = "192.168.1.1"

    def test_token_refresh_with_valid_refresh_token(self):
        """
        Test token refresh with valid refresh_token.
        **Validates: Requirements 1.6, 1.7**
        """
        # First, login to get tokens
        login_result = AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        refresh_token = login_result['refresh_token']
        
        # Now refresh
        new_access = AuthService.refresh_token(refresh_token)
        
        # Verify new access token is returned
        self.assertIsNotNone(new_access)
        self.assertIsInstance(new_access, str)
        self.assertTrue(len(new_access) > 0)

    def test_token_refresh_with_expired_token(self):
        """
        Test token refresh with expired token.
        **Validates: Requirements 1.7**
        """
        # Create an expired refresh token record
        expired_token_hash = "expired_token_hash_12345"
        RefreshToken.objects.create(
            officer=self.officer,
            token_hash=expired_token_hash,
            expires_at=timezone.now() - timedelta(hours=1),  # Already expired
            revoked=False
        )
        
        # Try to refresh with an invalid token (simulating expired)
        with self.assertRaises(AuthenticationError) as context:
            AuthService.refresh_token("invalid.token.here")
        
        self.assertIn("Invalid refresh token", str(context.exception))

    def test_token_refresh_with_revoked_token(self):
        """
        Test token refresh with revoked token.
        **Validates: Requirements 1.7**
        """
        # Login first
        login_result = AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        refresh_token = login_result['refresh_token']
        
        # Revoke the token
        RefreshToken.objects.filter(officer=self.officer).update(revoked=True)
        
        # Try to use revoked token
        with self.assertRaises(AuthenticationError):
            AuthService.refresh_token(refresh_token)


class LogoutTests(TestCase):
    """Tests for AuthService.logout() method."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_pin = "12345678"
        self.pin_hash = hash_pin(self.test_pin)
        
        self.officer = Officer.objects.create(
            national_id="55555555",
            full_name="Test Officer 3",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )
        
        self.ip_address = "192.168.1.1"

    def test_logout_revokes_token(self):
        """
        Test that logout revokes the refresh_token.
        **Validates: Requirements 1.9**
        """
        # Login first
        login_result = AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        refresh_token = login_result['refresh_token']
        
        # Verify token is not revoked yet
        tokens_before = RefreshToken.objects.filter(officer=self.officer, revoked=False)
        self.assertEqual(tokens_before.count(), 1)
        
        # Logout
        AuthService.logout(self.officer.id, refresh_token)
        
        # Verify token is now revoked
        tokens_after = RefreshToken.objects.filter(officer=self.officer, revoked=False)
        self.assertEqual(tokens_after.count(), 0)
        
        # Verify revoked flag is set
        revoked_token = RefreshToken.objects.get(officer=self.officer)
        self.assertTrue(revoked_token.revoked)

    def test_logout_creates_audit_log(self):
        """
        Test that logout creates AuditLog entry.
        **Validates: Requirements 17.6**
        """
        # Login first
        login_result = AuthService.login(self.officer.national_id, self.test_pin, self.ip_address)
        refresh_token = login_result['refresh_token']
        
        # Clear existing audit logs
        AuditLog.objects.all().delete()
        
        # Logout
        AuthService.logout(self.officer.id, refresh_token)
        
        # Verify AuditLog entry
        audit_logs = AuditLog.objects.filter(user=self.officer, action='LOGOUT')
        self.assertEqual(audit_logs.count(), 1)
        
        log = audit_logs.first()
        self.assertEqual(log.entity_type, 'OFFICER')
        self.assertEqual(log.entity_id, self.officer.id)


class ChangePinTests(TestCase):
    """Tests for AuthService.change_pin() method."""

    def setUp(self):
        """Set up test fixtures."""
        self.current_pin = "12345678"
        self.pin_hash = hash_pin(self.current_pin)
        
        self.officer = Officer.objects.create(
            national_id="77777777",
            full_name="Test Officer 4",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )
        
        self.ip_address = "192.168.1.1"

    def test_change_pin_with_correct_current_pin(self):
        """
        Test PIN change with correct current PIN.
        **Validates: Requirements 2.1, 2.4**
        """
        new_pin = "87654321"
        
        # Change PIN
        AuthService.change_pin(self.officer.id, self.current_pin, new_pin)
        
        # Verify PIN was changed
        self.officer.refresh_from_db()
        self.assertTrue(verify_pin(new_pin, self.officer.pin_hash))
        self.assertFalse(verify_pin(self.current_pin, self.officer.pin_hash))

    def test_change_pin_with_incorrect_current_pin(self):
        """
        Test PIN change with incorrect current PIN.
        **Validates: Requirements 2.2**
        """
        new_pin = "87654321"
        wrong_current_pin = "wrongpin"
        
        with self.assertRaises(AuthenticationError) as context:
            AuthService.change_pin(self.officer.id, wrong_current_pin, new_pin)
        
        self.assertIn("Current PIN is incorrect", str(context.exception))

    def test_change_pin_with_same_pin(self):
        """
        Test PIN change with new PIN same as current.
        **Validates: Requirements 2.3**
        """
        with self.assertRaises(ServiceValidationError) as context:
            AuthService.change_pin(self.officer.id, self.current_pin, self.current_pin)
        
        self.assertIn("different", str(context.exception).lower())

    def test_change_pin_revokes_all_refresh_tokens(self):
        """
        Test that PIN change revokes all refresh tokens.
        **Validates: Requirements 2.5**
        """
        # Login to create refresh tokens
        AuthService.login(self.officer.national_id, self.current_pin, self.ip_address)
        
        # Create additional refresh tokens
        for i in range(3):
            RefreshToken.objects.create(
                officer=self.officer,
                token_hash=f"token_hash_{i}",
                expires_at=timezone.now() + timedelta(days=7),
                revoked=False
            )
        
        # Verify we have 4 active tokens (1 from login + 3 created)
        active_tokens = RefreshToken.objects.filter(officer=self.officer, revoked=False)
        self.assertEqual(active_tokens.count(), 4)
        
        # Change PIN
        new_pin = "99999999"
        AuthService.change_pin(self.officer.id, self.current_pin, new_pin)
        
        # Verify all tokens are now revoked
        active_tokens = RefreshToken.objects.filter(officer=self.officer, revoked=False)
        self.assertEqual(active_tokens.count(), 0)

    def test_change_pin_creates_audit_log(self):
        """
        Test that PIN change creates AuditLog entry.
        **Validates: Requirements 2.5**
        """
        new_pin = "87654321"
        
        # Clear existing logs
        AuditLog.objects.all().delete()
        
        # Change PIN
        AuthService.change_pin(self.officer.id, self.current_pin, new_pin)
        
        # Verify AuditLog entry
        audit_logs = AuditLog.objects.filter(user=self.officer, action='PIN_CHANGE')
        self.assertEqual(audit_logs.count(), 1)
        
        log = audit_logs.first()
        self.assertEqual(log.entity_type, 'OFFICER')
        self.assertEqual(log.entity_id, self.officer.id)


class LoginAPIEndpointTests(APITestCase):
    """Tests for POST /api/auth/login/ endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()
        
        self.test_pin = "12345678"
        self.pin_hash = hash_pin(self.test_pin)
        
        self.officer = Officer.objects.create(
            national_id="11111111",
            full_name="Test Officer API",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )

    def test_login_endpoint_with_valid_credentials(self):
        """
        Test POST /api/auth/login/ with valid credentials.
        **Validates: Requirements 1.1, 1.2**
        """
        response = self.client.post('/api/auth/login/', {
            'national_id': self.officer.national_id,
            'pin': self.test_pin
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)

    def test_login_endpoint_with_invalid_pin(self):
        """
        Test POST /api/auth/login/ with invalid PIN.
        **Validates: Requirements 1.3**
        """
        response = self.client.post('/api/auth/login/', {
            'national_id': self.officer.national_id,
            'pin': 'wrongpin'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_endpoint_with_nonexistent_national_id(self):
        """
        Test POST /api/auth/login/ with non-existent national_id.
        **Validates: Requirements 1.3**
        """
        response = self.client.post('/api/auth/login/', {
            'national_id': '99999999',
            'pin': self.test_pin
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)


class RefreshTokenAPIEndpointTests(APITestCase):
    """Tests for POST /api/auth/refresh/ endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()
        
        self.test_pin = "12345678"
        self.pin_hash = hash_pin(self.test_pin)
        
        self.officer = Officer.objects.create(
            national_id="22222222",
            full_name="Test Officer API 2",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )

    def test_refresh_endpoint_with_valid_token(self):
        """
        Test POST /api/auth/refresh/ with valid refresh token.
        **Validates: Requirements 1.6**
        """
        # First login
        login_response = self.client.post('/api/auth/login/', {
            'national_id': self.officer.national_id,
            'pin': self.test_pin
        }, format='json')
        
        refresh_token = login_response.data['refresh_token']
        
        # Now refresh
        response = self.client.post('/api/auth/refresh/', {
            'refresh': refresh_token
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)


class LogoutAPIEndpointTests(APITestCase):
    """Tests for POST /api/auth/logout/ endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()
        
        self.test_pin = "12345678"
        self.pin_hash = hash_pin(self.test_pin)
        
        self.officer = Officer.objects.create(
            national_id="33333333",
            full_name="Test Officer API 3",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )

    def test_logout_endpoint(self):
        """
        Test POST /api/auth/logout/ endpoint.
        **Validates: Requirements 1.9**
        """
        # First login
        login_response = self.client.post('/api/auth/login/', {
            'national_id': self.officer.national_id,
            'pin': self.test_pin
        }, format='json')
        
        refresh_token = login_response.data['refresh_token']
        access_token = login_response.data['access_token']
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Logout
        response = self.client.post('/api/auth/logout/', {
            'refresh_token': refresh_token
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))


class ChangePinAPIEndpointTests(APITestCase):
    """Tests for POST /api/auth/change-pin/ endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        self.client = APIClient()
        
        self.current_pin = "12345678"
        self.pin_hash = hash_pin(self.current_pin)
        
        self.officer = Officer.objects.create(
            national_id="44444444",
            full_name="Test Officer API 4",
            phone="+254712345678",
            role="REGISTRATION_OFFICER",
            status="ACTIVE",
            pin_hash=self.pin_hash
        )

    def test_change_pin_endpoint_with_correct_current_pin(self):
        """
        Test POST /api/auth/change-pin/ with correct current PIN.
        **Validates: Requirements 2.1, 2.4**
        """
        # First login
        login_response = self.client.post('/api/auth/login/', {
            'national_id': self.officer.national_id,
            'pin': self.current_pin
        }, format='json')
        
        access_token = login_response.data['access_token']
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Change PIN
        response = self.client.post('/api/auth/change-pin/', {
            'current_pin': self.current_pin,
            'new_pin': '87654321'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))

    def test_change_pin_endpoint_with_incorrect_current_pin(self):
        """
        Test POST /api/auth/change-pin/ with incorrect current PIN.
        **Validates: Requirements 2.2**
        """
        # First login
        login_response = self.client.post('/api/auth/login/', {
            'national_id': self.officer.national_id,
            'pin': self.current_pin
        }, format='json')
        
        access_token = login_response.data['access_token']
        
        # Set authorization header
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Try to change PIN with wrong current PIN
        response = self.client.post('/api/auth/change-pin/', {
            'current_pin': 'wrongpin',
            'new_pin': '87654321'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
