"""
Tests for SDICS models and utilities.
"""

from django.test import TestCase
from django.utils import timezone
from .models import Officer, Citizen, Campaign, ImportLog, AuditLog
from .utils import hash_pin, verify_pin, generate_system_pin


class OfficerModelTests(TestCase):
    """Tests for Officer model."""

    def setUp(self):
        self.pin = generate_system_pin()
        self.pin_hash = hash_pin(self.pin)

    def test_officer_creation(self):
        """Test creating an officer with proper fields."""
        officer = Officer.objects.create(
            national_id='12345678',
            full_name='John Doe',
            phone='+254712345678',
            role='REGISTRATION_OFFICER',
            status='ACTIVE',
            pin_hash=self.pin_hash
        )
        self.assertEqual(officer.national_id, '12345678')
        self.assertEqual(officer.status, 'ACTIVE')
        self.assertNotEqual(officer.pin_hash, self.pin)  # PIN should be hashed

    def test_officer_unique_national_id(self):
        """Test that national_id is unique."""
        Officer.objects.create(
            national_id='12345678',
            full_name='John Doe',
            phone='+254712345678',
            pin_hash=self.pin_hash
        )
        with self.assertRaises(Exception):  # IntegrityError
            Officer.objects.create(
                national_id='12345678',
                full_name='Jane Doe',
                phone='+254712345679',
                pin_hash=self.pin_hash
            )


class CitizenModelTests(TestCase):
    """Tests for Citizen model."""

    def test_citizen_creation(self):
        """Test creating a citizen with all fields."""
        citizen = Citizen.objects.create(
            national_id='87654321',
            full_name='Jane Smith',
            sex='FEMALE',
            date_of_birth='1990-01-15',
            tribe='Kikuyu',
            phone_number='+254701234567',
            county='Nairobi',
            district='Westlands',
            division='Kilimani',
            location='Karen',
            sub_location='Langata',
            village='Nairobi South'
        )
        self.assertEqual(citizen.national_id, '87654321')
        self.assertEqual(citizen.registration_status, 'UNREGISTERED')

    def test_citizen_unique_national_id(self):
        """Test that national_id is unique."""
        Citizen.objects.create(
            national_id='87654321',
            full_name='Jane Smith',
            county='Nairobi',
            district='Westlands',
            division='Kilimani',
            location='Karen'
        )
        with self.assertRaises(Exception):  # IntegrityError
            Citizen.objects.create(
                national_id='87654321',
                full_name='John Smith',
                county='Nairobi',
                district='Westlands',
                division='Kilimani',
                location='Karen'
            )


class PINUtilityTests(TestCase):
    """Tests for PIN utilities."""

    def test_pin_hashing(self):
        """Test that PIN hashing works correctly."""
        pin = '123456'
        hashed = hash_pin(pin)
        self.assertNotEqual(pin, hashed)
        self.assertTrue(verify_pin(pin, hashed))
        self.assertFalse(verify_pin('654321', hashed))

    def test_pin_generation(self):
        """Test that generated PINs are unique."""
        pins = set(generate_system_pin() for _ in range(100))
        self.assertEqual(len(pins), 100)  # All should be unique

    def test_generated_pin_length(self):
        """Test that generated PINs are 6 characters."""
        pin = generate_system_pin()
        self.assertEqual(len(pin), 6)


class AuditLogImmutabilityTests(TestCase):
    """Tests for AuditLog immutability."""

    def setUp(self):
        self.officer = Officer.objects.create(
            national_id='12345678',
            full_name='John Doe',
            phone='+254712345678',
            pin_hash=hash_pin('123456')
        )

    def test_audit_log_creation(self):
        """Test creating an audit log."""
        log = AuditLog.objects.create(
            user=self.officer,
            action='LOGIN',
            entity_type='OFFICER',
            entity_id=self.officer.id,
            ip_address='192.168.1.1'
        )
        self.assertEqual(log.action, 'LOGIN')

    def test_audit_log_cannot_be_updated(self):
        """Test that audit logs cannot be updated."""
        log = AuditLog.objects.create(
            user=self.officer,
            action='LOGIN',
            entity_type='OFFICER',
            entity_id=self.officer.id
        )
        log.action = 'LOGOUT'
        with self.assertRaises(ValueError):
            log.save()

    def test_audit_log_cannot_be_deleted(self):
        """Test that audit logs cannot be deleted."""
        log = AuditLog.objects.create(
            user=self.officer,
            action='LOGIN',
            entity_type='OFFICER',
            entity_id=self.officer.id
        )
        with self.assertRaises(ValueError):
            log.delete()
