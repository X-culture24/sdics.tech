"""
Serializers for SDICS API endpoints.
"""

from rest_framework import serializers
from .models import Officer, Citizen, Campaign, Registration, AuditLog, ImportLog, OfficerAssignedLocation


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint."""
    national_id = serializers.CharField(required=True, max_length=20)
    pin = serializers.CharField(required=True, write_only=True, max_length=12)

    def validate(self, data):
        if not data.get('national_id') or not data.get('pin'):
            raise serializers.ValidationError("national_id and pin are required")
        return data


class AdminLoginSerializer(serializers.Serializer):
    """Serializer for admin login endpoint."""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, max_length=128)

    def validate(self, data):
        if not data.get('email') or not data.get('password'):
            raise serializers.ValidationError("email and password are required")
        return data


class RefreshTokenSerializer(serializers.Serializer):
    """Serializer for token refresh endpoint."""
    refresh = serializers.CharField(required=True)


class ChangePinSerializer(serializers.Serializer):
    """Serializer for PIN change endpoint."""
    current_pin = serializers.CharField(required=True, write_only=True, max_length=12)
    new_pin = serializers.CharField(required=True, write_only=True, max_length=12)

    def validate(self, data):
        if not data.get('current_pin') or not data.get('new_pin'):
            raise serializers.ValidationError("current_pin and new_pin are required")
        if data['current_pin'] == data['new_pin']:
            raise serializers.ValidationError("new_pin must be different from current_pin")
        return data


class OfficerAssignedLocationSerializer(serializers.ModelSerializer):
    """Serializer for officer assigned locations."""
    class Meta:
        model = OfficerAssignedLocation
        fields = ('id', 'county', 'district', 'division', 'location', 'created_at')
        read_only_fields = ('id', 'created_at')


class OfficerSerializer(serializers.ModelSerializer):
    """Serializer for officer management."""
    assigned_locations = OfficerAssignedLocationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Officer
        fields = ('id', 'national_id', 'full_name', 'phone', 'role', 'status', 'assigned_locations', 'last_login', 'created_at')
        read_only_fields = ('id', 'created_at', 'last_login')


class CitizenSerializer(serializers.ModelSerializer):
    """Serializer for citizen data."""
    class Meta:
        model = Citizen
        fields = (
            'id', 'national_id', 'full_name', 'sex', 'date_of_birth', 'tribe', 'phone_number',
            'county', 'district', 'division', 'location', 'sub_location', 'village',
            'registration_status', 'registered_at', 'registered_by', 'campaign', 'source_file', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'registered_at', 'registered_by', 'campaign')


class CampaignSerializer(serializers.ModelSerializer):
    """Serializer for campaign management."""
    class Meta:
        model = Campaign
        fields = ('id', 'name', 'description', 'start_date', 'end_date', 'target_count', 'status', 'created_by', 'created_at')
        read_only_fields = ('id', 'created_at', 'created_by')


class RegistrationSerializer(serializers.ModelSerializer):
    """Serializer for registration records."""
    class Meta:
        model = Registration
        fields = ('id', 'citizen', 'officer', 'campaign', 'registered_at', 'location', 'device_info', 'ip_address', 'created_at')
        read_only_fields = ('id', 'created_at', 'officer')


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs (read-only)."""
    class Meta:
        model = AuditLog
        fields = ('id', 'user', 'action', 'entity_type', 'entity_id', 'ip_address', 'metadata', 'created_at')
        read_only_fields = ('id', 'created_at', 'user', 'action', 'entity_type', 'entity_id', 'ip_address', 'metadata')


class ImportLogSerializer(serializers.ModelSerializer):
    """Serializer for import logs (read-only)."""
    class Meta:
        model = ImportLog
        fields = (
            'id', 'file_path', 'county', 'sheet_name', 'total_rows', 'processed_count',
            'skipped_count', 'duplicate_count', 'failed_count', 'status', 'started_at', 'completed_at', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'started_at', 'completed_at')
