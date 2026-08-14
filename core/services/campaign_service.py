"""
Campaign Management Service
Handles campaign CRUD and state transitions.
"""

from django.utils import timezone
from django.db.models import Count, Q
from core.models import Campaign, Registration, AuditLog
from core.exceptions import ValidationError, NotFoundError


class CampaignService:
    """Handles campaign management operations."""

    @staticmethod
    def create_campaign(name, description, start_date, end_date, target_count, admin_officer):
        """
        Create new campaign.
        
        Args:
            name: Campaign name
            description: Campaign description
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            target_count: Target registration count
            admin_officer: Officer creating campaign
            
        Returns:
            Created Campaign instance
            
        Raises:
            ValidationError: If date range invalid
        """
        # Validate date range
        if start_date > end_date:
            raise ValidationError('Invalid date range', {'dates': 'start_date must be <= end_date'})

        campaign = Campaign.objects.create(
            name=name,
            description=description,
            start_date=start_date,
            end_date=end_date,
            target_count=target_count,
            status='PLANNED',
            created_by=admin_officer
        )

        # Create audit log
        AuditLog.objects.create(
            user=admin_officer,
            action='CAMPAIGN_CREATE',
            entity_type='CAMPAIGN',
            entity_id=campaign.id,
            metadata={'name': name, 'target_count': target_count}
        )

        return campaign

    @staticmethod
    def list_campaigns(status=None, page=1, page_size=25):
        """
        List campaigns with optional status filter.
        
        Args:
            status: Filter by status (PLANNED, ACTIVE, CLOSED)
            page: Page number
            page_size: Results per page
            
        Returns:
            Queryset of campaigns
        """
        queryset = Campaign.objects.all().select_related('created_by')

        if status:
            queryset = queryset.filter(status=status)

        # Annotate with registration counts
        queryset = queryset.annotate(
            registrations_count=Count(
                'registration',
                filter=Q(registration__citizen__campaign=timezone.now())
            )
        ).order_by('-created_at')

        return queryset

    @staticmethod
    def get_campaign(campaign_id):
        """
        Get campaign by ID.
        
        Raises:
            NotFoundError: If campaign not found
        """
        try:
            return Campaign.objects.select_related('created_by').get(id=campaign_id)
        except Campaign.DoesNotExist:
            raise NotFoundError('Campaign not found')

    @staticmethod
    def update_status(campaign_id, new_status, admin_officer):
        """
        Update campaign status with state machine validation.
        Handles transitions: PLANNED -> ACTIVE -> CLOSED
        
        Args:
            campaign_id: Campaign to update
            new_status: New status (PLANNED, ACTIVE, CLOSED)
            admin_officer: Officer performing update
            
        Returns:
            Updated Campaign instance
            
        Raises:
            NotFoundError: If campaign not found
            ValidationError: If invalid transition
        """
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            raise NotFoundError('Campaign not found')

        old_status = campaign.status

        # Validate state transition
        valid_transitions = {
            'PLANNED': ['ACTIVE', 'CLOSED'],
            'ACTIVE': ['CLOSED'],
            'CLOSED': []
        }

        if new_status not in valid_transitions.get(old_status, []):
            raise ValidationError(
                f'Cannot transition from {old_status} to {new_status}',
                {'status': f'Invalid transition'}
            )

        # If changing to ACTIVE, close all other ACTIVE campaigns
        if new_status == 'ACTIVE':
            Campaign.objects.filter(status='ACTIVE').update(status='CLOSED')

        campaign.status = new_status
        campaign.save()

        # Create audit log
        AuditLog.objects.create(
            user=admin_officer,
            action='CAMPAIGN_UPDATE',
            entity_type='CAMPAIGN',
            entity_id=campaign.id,
            metadata={'old_status': old_status, 'new_status': new_status}
        )

        return campaign

    @staticmethod
    def get_registration_percentage(campaign):
        """Calculate registration percentage for campaign."""
        if not campaign.target_count or campaign.target_count == 0:
            return 0

        registration_count = Registration.objects.filter(campaign=campaign).count()
        return (registration_count / campaign.target_count) * 100
