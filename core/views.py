"""
API views for SDICS.
"""

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count, Case, When
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Officer, Citizen, Campaign, Registration, AuditLog, ImportLog
from .serializers import (
    OfficerSerializer, CitizenSerializer, CampaignSerializer,
    RegistrationSerializer, AuditLogSerializer, ImportLogSerializer,
    LoginSerializer, RefreshTokenSerializer, ChangePinSerializer
)
from .services.auth_service import AuthService
from .services.citizen_service import CitizenService
from .services.dashboard_service import DashboardService
from .exceptions import AuthenticationError, RateLimitError

logger = logging.getLogger(__name__)


class LoginView(APIView):
    """Login endpoint - POST /api/auth/login/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid input', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        national_id = serializer.validated_data['national_id']
        pin = serializer.validated_data['pin']
        ip_address = self.get_client_ip(request)

        try:
            result = AuthService.login(national_id, pin, ip_address)
            return Response({
                'access_token': result['access_token'],
                'refresh_token': result['refresh_token'],
                'officer': result['officer'],
            }, status=status.HTTP_200_OK)
        except RateLimitError as e:
            return Response(
                {'error': {'code': 'RATE_LIMIT', 'message': str(e)}},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        except AuthenticationError:
            return Response(
                {'error': {'code': 'INVALID_CREDENTIALS', 'message': 'Invalid credentials'}},
                status=status.HTTP_401_UNAUTHORIZED
            )

    def get_client_ip(self, request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AdminLoginView(APIView):
    """Admin login endpoint - POST /api/auth/admin-login/"""
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import AdminLoginSerializer
        serializer = AdminLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid input', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        ip_address = self.get_client_ip(request)

        try:
            result = AuthService.admin_login(email, password, ip_address)
            return Response({
                'access_token': result['access_token'],
                'refresh_token': result['refresh_token'],
                'officer': result['officer'],
            }, status=status.HTTP_200_OK)
        except AuthenticationError:
            return Response(
                {'error': {'code': 'INVALID_CREDENTIALS', 'message': 'Invalid credentials'}},
                status=status.HTTP_401_UNAUTHORIZED
            )

    def options(self, request, *args, **kwargs):
        response = Response(status=status.HTTP_200_OK)
        response['Access-Control-Allow-Origin'] = request.META.get('HTTP_ORIGIN', '*')
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response

    def get_client_ip(self, request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RefreshTokenView(APIView):
    """Token refresh endpoint - POST /api/auth/refresh/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid input'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh_token = serializer.validated_data['refresh']
        try:
            new_access_token = AuthService.refresh_token(refresh_token)
            return Response({
                'access_token': str(new_access_token),
            }, status=status.HTTP_200_OK)
        except AuthenticationError:
            return Response(
                {'error': {'code': 'INVALID_TOKEN', 'message': 'Token expired or invalid'}},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """Logout endpoint - POST /api/auth/logout/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'refresh_token required'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            AuthService.logout(request.officer_id, refresh_token)
            return Response({'success': True}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': {'code': 'ERROR', 'message': str(e)}},
                status=status.HTTP_400_BAD_REQUEST
            )


class ChangePinView(APIView):
    """PIN change endpoint - POST /api/auth/change-pin/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': {'code': 'VALIDATION_ERROR', 'message': 'Invalid input', 'details': serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_pin = serializer.validated_data['current_pin']
        new_pin = serializer.validated_data['new_pin']

        try:
            AuthService.change_pin(request.officer_id, current_pin, new_pin)
            return Response({'success': True}, status=status.HTTP_200_OK)
        except AuthenticationError:
            return Response(
                {'error': {'code': 'INVALID_PIN', 'message': 'Current PIN is invalid'}},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'error': {'code': 'ERROR', 'message': str(e)}},
                status=status.HTTP_400_BAD_REQUEST
            )


class StandardPagination(PageNumberPagination):
    """Standard pagination for list endpoints."""
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'


class CitizenViewSet(viewsets.ModelViewSet):
    """Citizen search and registration endpoints."""
    queryset = Citizen.objects.all()
    serializer_class = CitizenSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['national_id', 'full_name']
    ordering_fields = ['created_at', 'registration_status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter citizens based on officer's assigned locations and query params."""
        queryset = Citizen.objects.all()
        
        # Apply filters from query params
        county = self.request.query_params.get('county')
        district = self.request.query_params.get('district')
        division = self.request.query_params.get('division')
        location = self.request.query_params.get('location')
        registration_status = self.request.query_params.get('registration_status')
        
        if county:
            queryset = queryset.filter(county=county)
        if district:
            queryset = queryset.filter(district=district)
        if division:
            queryset = queryset.filter(division=division)
        if location:
            queryset = queryset.filter(location=location)
        if registration_status:
            queryset = queryset.filter(registration_status=registration_status)
        
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def counties(self, request):
        """Get list of all counties."""
        counties = Citizen.objects.values_list('county', flat=True).distinct().order_by('county')
        return Response(list(counties))

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def districts(self, request):
        """Get districts for a specific county."""
        county = request.query_params.get('county')
        if not county:
            return Response({'error': 'county parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        districts = Citizen.objects.filter(county=county).values_list('district', flat=True).distinct().order_by('district')
        return Response(list(districts))

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def divisions(self, request):
        """Get divisions for a specific district."""
        county = request.query_params.get('county')
        district = request.query_params.get('district')
        
        if not county or not district:
            return Response({'error': 'county and district parameters required'}, status=status.HTTP_400_BAD_REQUEST)
        
        divisions = Citizen.objects.filter(
            county=county, district=district
        ).values_list('division', flat=True).distinct().order_by('division')
        return Response(list(divisions))

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def locations(self, request):
        """Get locations for a specific division."""
        county = request.query_params.get('county')
        district = request.query_params.get('district')
        division = request.query_params.get('division')
        
        if not county or not district or not division:
            return Response({'error': 'county, district, and division parameters required'}, status=status.HTTP_400_BAD_REQUEST)
        
        locations = Citizen.objects.filter(
            county=county, district=district, division=division
        ).values_list('location', flat=True).distinct().order_by('location')
        return Response(list(locations))

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def sub_locations(self, request):
        """Get sub-locations for a specific location."""
        county = request.query_params.get('county')
        district = request.query_params.get('district')
        division = request.query_params.get('division')
        location = request.query_params.get('location')
        
        if not all([county, district, division, location]):
            return Response({'error': 'county, district, division, and location parameters required'}, status=status.HTTP_400_BAD_REQUEST)
        
        sub_locations = Citizen.objects.filter(
            county=county, district=district, division=division, location=location
        ).values_list('sub_location', flat=True).distinct().order_by('sub_location')
        return Response(list(sub_locations))

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def villages(self, request):
        """Get villages for a specific sub-location."""
        county = request.query_params.get('county')
        district = request.query_params.get('district')
        division = request.query_params.get('division')
        location = request.query_params.get('location')
        sub_location = request.query_params.get('sub_location')
        
        if not all([county, district, division, location, sub_location]):
            return Response({'error': 'all location parameters required'}, status=status.HTTP_400_BAD_REQUEST)
        
        villages = Citizen.objects.filter(
            county=county, district=district, division=division, location=location, sub_location=sub_location
        ).values_list('village', flat=True).distinct().order_by('village')
        return Response(list(villages))

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def register(self, request, pk=None):
        """Register a citizen."""
        citizen = self.get_object()
        
        try:
            registration = CitizenService.register_citizen(
                citizen.national_id,
                request.officer,
                campaign_id=request.data.get('campaign_id'),
                request=request
            )
            return Response({
                'success': True,
                'registration_id': registration.id,
                'registered_at': registration.registered_at
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardView(APIView):
    """Dashboard metrics endpoints."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """GET /api/dashboard/summary/ - Overall dashboard metrics."""
        try:
            summary = DashboardService.get_summary()
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """Delegate to appropriate summary method based on query param."""
        if request.path.endswith('/summary/'):
            return self.summary(request)
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class DashboardSummaryView(APIView):
    """Dashboard summary endpoint."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/dashboard/summary/"""
        try:
            summary = DashboardService.get_summary()
            return Response(summary, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardByCountyView(APIView):
    """Dashboard metrics by county."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/dashboard/by-county/"""
        try:
            metrics = DashboardService.get_by_county()
            return Response(metrics, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardByDistrictView(APIView):
    """Dashboard metrics by district."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/dashboard/by-district/"""
        county = request.query_params.get('county')
        try:
            metrics = DashboardService.get_by_district(county=county)
            return Response(metrics, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardByOfficerView(APIView):
    """Dashboard metrics by officer."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/dashboard/by-officer/"""
        status_filter = request.query_params.get('status')
        try:
            metrics = DashboardService.get_by_officer(status=status_filter)
            return Response(metrics, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardTrendsView(APIView):
    """Dashboard trends endpoint."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/dashboard/trends/"""
        days = request.query_params.get('days', 7)
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        try:
            trends = DashboardService.get_trends(
                days=int(days),
                start_date=start_date,
                end_date=end_date
            )
            return Response(trends, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OfficerViewSet(viewsets.ModelViewSet):
    """Officer management endpoints."""
    queryset = Officer.objects.all()
    serializer_class = OfficerSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def issue_pin(self, request, pk=None):
        """
        Issue or regenerate a PIN for an officer.
        POST /api/officers/{id}/issue_pin/
        Returns the newly generated PIN (displayed once to admin).
        """
        from .services.auth_service import AuthService
        from .exceptions import NotFoundError
        
        try:
            officer = self.get_object()
            
            # Check authorization - only admins can issue PINs
            if request.officer.role != 'ADMINISTRATOR':
                return Response(
                    {'error': {'code': 'PERMISSION_DENIED', 'message': 'Only administrators can issue PINs'}},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate new PIN
            new_pin = AuthService.generate_random_pin()
            pin_hash = AuthService.hash_pin(new_pin)
            
            # Update officer PIN
            officer.pin_hash = pin_hash
            officer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.officer,
                action='PIN_ISSUED',
                entity_type='OFFICER',
                entity_id=officer.id,
                metadata={'target_officer_id': officer.id, 'target_officer_name': officer.full_name}
            )
            
            return Response({
                'pin': new_pin,
                'officer_id': officer.id,
                'officer_name': officer.full_name,
                'message': 'PIN generated. Share securely with officer.'
            }, status=status.HTTP_200_OK)
            
        except Officer.DoesNotExist:
            return Response(
                {'error': {'code': 'NOT_FOUND', 'message': 'Officer not found'}},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': {'code': 'SERVER_ERROR', 'message': str(e)}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CampaignViewSet(viewsets.ModelViewSet):
    """Campaign management endpoints."""
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination


class RegistrationViewSet(viewsets.ModelViewSet):
    """Registration tracking endpoints."""
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log query endpoints (read-only)."""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination


class ImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Import log query endpoints (read-only)."""
    queryset = ImportLog.objects.all()
    serializer_class = ImportLogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination



class ReportsView(APIView):
    """Generate and retrieve reports."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get reports based on query parameters."""
        report_type = request.query_params.get('type', 'daily_breakdown')
        
        try:
            raw_data: any
            if report_type == 'daily_breakdown':
                raw_data = DashboardService.get_daily_breakdown()
            elif report_type == 'officer_performance':
                raw_data = DashboardService.get_by_officer()
            elif report_type == 'location_conversion':
                raw_data = DashboardService.get_by_county()
            else:
                return Response(
                    {'error': f'Unknown report type: {report_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Normalize to ReportsPage expected format: { data: [], generated_at: string }
            if isinstance(raw_data, list):
                data_list = raw_data
            elif isinstance(raw_data, dict):
                if 'records' in raw_data and isinstance(raw_data['records'], list):
                    data_list = raw_data['records']
                elif 'data' in raw_data and isinstance(raw_data['data'], list):
                    data_list = raw_data['data']
                else:
                    # Convert dict-of-arrays to list
                    data_list = list(raw_data.values()) if raw_data else []
            else:
                data_list = []

            response_data = {
                'type': report_type,
                'generated_at': timezone.now().isoformat(),
                'data': data_list,
            }
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error generating report {report_type}: {str(e)}')
            return Response(
                {'error': 'Failed to generate report'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GapsView(APIView):
    """Identify and retrieve data gaps in registrations."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get registration gaps."""
        try:
            data = DashboardService.get_gaps()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error retrieving gaps: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve gaps'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyView(APIView):
    """Verify citizen registrations."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get verification statistics."""
        try:
            data = DashboardService.get_verify_stats()
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error retrieving verification stats: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve verification stats'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExportsView(APIView):
    """Export registration data."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get list of available exports."""
        try:
            limit = int(request.query_params.get('limit', 100))
            data = DashboardService.get_exports(limit=limit)
            return Response(data, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {'error': 'Invalid limit parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Error retrieving exports: {str(e)}')
            return Response(
                {'error': 'Failed to retrieve exports'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
