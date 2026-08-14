"""
Django admin configuration for SDICS.
"""

from django.contrib import admin
from .models import (
    Officer, OfficerAssignedLocation, RefreshToken,
    Campaign, Citizen, Registration, ImportLog, AuditLog
)


@admin.register(Officer)
class OfficerAdmin(admin.ModelAdmin):
    list_display = ('national_id', 'full_name', 'role', 'status', 'last_login', 'created_at')
    list_filter = ('role', 'status', 'created_at')
    search_fields = ('national_id', 'full_name', 'phone')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Identification', {'fields': ('national_id', 'full_name', 'phone')}),
        ('Access Control', {'fields': ('role', 'status', 'pin_hash', 'last_login')}),
        ('Metadata', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(OfficerAssignedLocation)
class OfficerAssignedLocationAdmin(admin.ModelAdmin):
    list_display = ('officer', 'county', 'district', 'created_at')
    list_filter = ('county', 'district')
    search_fields = ('officer__full_name', 'county', 'district')


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    list_display = ('officer', 'revoked', 'expires_at', 'created_at')
    list_filter = ('revoked', 'expires_at')
    readonly_fields = ('officer', 'token_hash', 'created_at')


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'start_date', 'end_date', 'target_count', 'created_at')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Citizen)
class CitizenAdmin(admin.ModelAdmin):
    list_display = ('national_id', 'full_name', 'district', 'registration_status', 'created_at')
    list_filter = ('registration_status', 'county', 'district', 'created_at')
    search_fields = ('national_id', 'full_name', 'phone_number')
    readonly_fields = ('created_at', 'updated_at', 'registered_at')
    fieldsets = (
        ('Identification', {'fields': ('national_id', 'full_name')}),
        ('Demographics', {'fields': ('sex', 'date_of_birth', 'tribe', 'phone_number')}),
        ('Location', {'fields': ('county', 'district', 'division', 'location', 'sub_location', 'village')}),
        ('Registration', {'fields': ('registration_status', 'registered_at', 'registered_by', 'campaign')}),
        ('Import', {'fields': ('source_file', 'created_at', 'updated_at')}),
    )


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('citizen', 'officer', 'registered_at', 'created_at')
    list_filter = ('campaign', 'registered_at', 'created_at')
    search_fields = ('citizen__full_name', 'citizen__national_id', 'officer__full_name')
    readonly_fields = ('created_at',)


@admin.register(ImportLog)
class ImportLogAdmin(admin.ModelAdmin):
    list_display = ('file_path', 'county', 'status', 'processed_count', 'duplicate_count', 'created_at')
    list_filter = ('status', 'county', 'created_at')
    search_fields = ('file_path', 'county')
    readonly_fields = ('created_at', 'updated_at', 'started_at', 'completed_at')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'entity_type', 'ip_address', 'created_at')
    list_filter = ('action', 'entity_type', 'created_at')
    search_fields = ('user__full_name', 'ip_address')
    readonly_fields = ('action', 'user', 'entity_type', 'entity_id', 'ip_address', 'user_agent', 'metadata', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
