"""
Citizen Search and Registration Service
Handles citizen search, filtering, and registration workflows.
"""

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from core.models import Citizen, Registration, AuditLog
from core.exceptions import ValidationError, NotFoundError, ConflictError, AuthenticationError
import json
from user_agents import parse


class CitizenService:
    """Handles citizen search, filtering, and registration."""

    @staticmethod
    def search_citizens(query, officer, page=1, page_size=25):
        """
        Search citizens by national_id or name.
        Filters by officer's assigned locations and unregistered status.
        
        Args:
            query: Search query (national_id prefix or partial name)
            officer: Officer performing search (for location filtering)
            page: Page number
            page_size: Results per page
            
        Returns:
            Queryset of matching citizens
        """
        if not query or not query.strip():
            raise ValidationError('Search query required', {'q': 'Cannot be empty'})

        query = query.strip()

        # Build search queryset
        queryset = Citizen.objects.filter(registration_status='UNREGISTERED')

        # Apply location filter (unless admin)
        if officer.role != 'ADMINISTRATOR':
            locations = officer.assigned_locations.values_list('county', flat=True)
            queryset = queryset.filter(county__in=locations)

        # Search by national_id (prefix) or name (partial, case-insensitive)
        queryset = queryset.filter(
            Q(national_id__istartswith=query) |
            Q(full_name__icontains=query)
        ).order_by('-created_at')

        # Create audit log
        AuditLog.objects.create(
            user=officer,
            action='SEARCH',
            entity_type='CITIZEN',
            metadata={'query': query, 'results_count': queryset.count()}
        )

        return queryset

    @staticmethod
    def filter_citizens(officer, county=None, district=None, division=None, 
                       location=None, sub_location=None, village=None, 
                       registration_status=None, page=1, page_size=25):
        """
        Filter citizens by location and status.
        Applies AND logic for multiple filters.
        
        Args:
            officer: Officer performing filter (for location authorization)
            county, district, division, etc.: Filter criteria
            registration_status: Filter by REGISTERED/UNREGISTERED
            page: Page number
            page_size: Results per page
            
        Returns:
            Filtered queryset
            
        Raises:
            AuthenticationError: If officer lacks location access
        """
        queryset = Citizen.objects.all()

        # Apply location authorization check for non-admins
        if officer.role != 'ADMINISTRATOR':
            assigned_locations = officer.assigned_locations.values_list('county', flat=True)
            if county and county not in assigned_locations:
                raise AuthenticationError('Access denied to this location')
            queryset = queryset.filter(county__in=assigned_locations)

        # Apply filters
        filters = {}
        if county:
            filters['county'] = county
        if district:
            filters['district'] = district
        if division:
            filters['division'] = division
        if location:
            filters['location'] = location
        if sub_location:
            filters['sub_location'] = sub_location
        if village:
            filters['village'] = village
        if registration_status:
            filters['registration_status'] = registration_status

        queryset = queryset.filter(**filters).order_by('-created_at')

        # Create audit log
        AuditLog.objects.create(
            user=officer,
            action='FILTER',
            entity_type='CITIZEN',
            metadata={'filters': filters, 'results_count': queryset.count()}
        )

        return queryset

    @staticmethod
    def get_citizen(national_id, officer):
        """
        Get citizen by national_id.
        Checks officer's location jurisdiction.
        
        Args:
            national_id: Citizen's national ID
            officer: Officer accessing citizen
            
        Returns:
            Citizen instance
            
        Raises:
            NotFoundError: If citizen not found
            AuthenticationError: If officer lacks access
        """
        try:
            citizen = Citizen.objects.get(national_id=national_id)
        except Citizen.DoesNotExist:
            raise NotFoundError('Citizen not found')

        # Check location access for non-admins
        if officer.role != 'ADMINISTRATOR':
            assigned_counties = officer.assigned_locations.values_list('county', flat=True)
            if citizen.county not in assigned_counties:
                raise AuthenticationError('Access denied to this location')

        return citizen

    @staticmethod
    def register_citizen(national_id, officer, campaign_id=None, request=None):
        """
        Register citizen - atomic transaction.
        Changes status from UNREGISTERED to REGISTERED.
        
        Args:
            national_id: Citizen's national ID
            officer: Officer performing registration
            campaign_id: Optional campaign ID
            request: HTTP request (for device_info extraction)
            
        Returns:
            Registration instance
            
        Raises:
            NotFoundError: If citizen not found
            ConflictError: If already registered
            AuthenticationError: If officer lacks access
        """
        try:
            citizen = Citizen.objects.get(national_id=national_id)
        except Citizen.DoesNotExist:
            raise NotFoundError('Citizen not found')

        # Check if already registered
        if citizen.registration_status == 'REGISTERED':
            raise ConflictError('Citizen already registered', 
                              {'registered_at': citizen.registered_at.isoformat() if citizen.registered_at else None})

        # Check location access
        if officer.role != 'ADMINISTRATOR':
            assigned_counties = officer.assigned_locations.values_list('county', flat=True)
            if citizen.county not in assigned_counties:
                raise AuthenticationError('Access denied to this location')

        # Check for duplicate registration (same officer within 60 seconds)
        recent_registration = Registration.objects.filter(
            citizen=citizen,
            officer=officer,
            created_at__gte=timezone.now() - timezone.timedelta(seconds=60)
        ).first()

        if recent_registration:
            raise ConflictError('Citizen already registered', 
                              {'registered_at': recent_registration.created_at.isoformat()})

        try:
            with transaction.atomic():
                # Update citizen
                citizen.registration_status = 'REGISTERED'
                citizen.registered_at = timezone.now()
                citizen.registered_by = officer
                if campaign_id:
                    citizen.campaign_id = campaign_id
                citizen.save()

                # Extract device info
                device_info = {}
                if request:
                    user_agent_string = request.META.get('HTTP_USER_AGENT', '')
                    try:
                        ua = parse(user_agent_string)
                        device_info = {
                            'user_agent': user_agent_string,
                            'device': ua.device.family if hasattr(ua.device, 'family') else '',
                            'os': f"{ua.os.family} {ua.os.version_string}",
                            'browser': f"{ua.browser.family} {ua.browser.version_string}",
                        }
                    except:
                        device_info = {'user_agent': user_agent_string}
                    
                    ip_address = CitizenService.get_client_ip(request)
                else:
                    ip_address = 'unknown'

                # Create registration record
                registration = Registration.objects.create(
                    citizen=citizen,
                    officer=officer,
                    campaign_id=campaign_id,
                    device_info=json.dumps(device_info) if device_info else None,
                    ip_address=ip_address
                )

                # Create audit log
                AuditLog.objects.create(
                    user=officer,
                    action='REGISTER',
                    entity_type='CITIZEN',
                    entity_id=citizen.id,
                    ip_address=ip_address,
                    metadata={
                        'citizen_id': citizen.id,
                        'officer_id': officer.id,
                        'campaign_id': campaign_id,
                        'location': citizen.location
                    }
                )

                # TODO: Broadcast to WebSocket clients
                # broadcast_registration_update(citizen, registration)

                return registration

        except Exception as e:
            raise ValidationError(f'Registration failed: {str(e)}')

    @staticmethod
    def get_client_ip(request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip
