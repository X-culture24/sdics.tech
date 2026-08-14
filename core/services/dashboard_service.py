"""
Dashboard Metrics Service
Provides aggregated metrics for the dashboard with caching.
"""

from django.core.cache import cache
from django.db.models import Count, Q, F
from django.utils import timezone
from datetime import timedelta
from core.models import Citizen, Registration, Officer


class DashboardService:
    """Provides dashboard metrics with caching."""

    CACHE_TTL_SHORT = 30  # 30 seconds for summary
    CACHE_TTL_LONG = 300  # 5 minutes for trends

    @staticmethod
    def get_summary():
        """
        Get dashboard summary metrics.
        Cached for 30 seconds.
        """
        cache_key = 'dashboard:summary'
        cached = cache.get(cache_key)
        if cached:
            return cached

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        summary = {
            'total_citizens': Citizen.objects.count(),
            'registered_count': Citizen.objects.filter(registration_status='REGISTERED').count(),
            'unregistered_count': Citizen.objects.filter(registration_status='UNREGISTERED').count(),
            'registrations_today': Registration.objects.filter(created_at__gte=today_start).count(),
            'total_officers': Officer.objects.filter(status='ACTIVE').count(),
        }

        # Calculate percentage
        if summary['total_citizens'] > 0:
            summary['registration_percentage'] = (
                summary['registered_count'] / summary['total_citizens'] * 100
            )
        else:
            summary['registration_percentage'] = 0

        cache.set(cache_key, summary, DashboardService.CACHE_TTL_SHORT)
        return summary

    @staticmethod
    def get_by_county():
        """
        Get metrics grouped by county.
        Cached for 30 seconds.
        """
        cache_key = 'dashboard:by_county'
        cached = cache.get(cache_key)
        if cached:
            return cached

        results = Citizen.objects.values('county').annotate(
            total_count=Count('id'),
            registered_count=Count('id', filter=Q(registration_status='REGISTERED')),
            unregistered_count=Count('id', filter=Q(registration_status='UNREGISTERED'))
        ).order_by('-registered_count')

        # Add percentage
        data = []
        for item in results:
            if item['total_count'] > 0:
                item['registration_percentage'] = (item['registered_count'] / item['total_count']) * 100
            else:
                item['registration_percentage'] = 0
            data.append(item)

        cache.set(cache_key, data, DashboardService.CACHE_TTL_SHORT)
        return data

    @staticmethod
    def get_by_district(county=None):
        """
        Get metrics grouped by district.
        Optionally filter by county.
        Cached for 30 seconds.
        """
        cache_key = f'dashboard:by_district:{county}' if county else 'dashboard:by_district'
        cached = cache.get(cache_key)
        if cached:
            return cached

        queryset = Citizen.objects.values('county', 'district')

        if county:
            queryset = queryset.filter(county=county)

        results = queryset.annotate(
            total_count=Count('id'),
            registered_count=Count('id', filter=Q(registration_status='REGISTERED')),
            unregistered_count=Count('id', filter=Q(registration_status='UNREGISTERED'))
        ).order_by('-registered_count')

        # Add percentage
        data = []
        for item in results:
            if item['total_count'] > 0:
                item['registration_percentage'] = (item['registered_count'] / item['total_count']) * 100
            else:
                item['registration_percentage'] = 0
            data.append(item)

        cache.set(cache_key, data, DashboardService.CACHE_TTL_SHORT)
        return data

    @staticmethod
    def get_by_officer(status=None):
        """
        Get metrics grouped by officer.
        Optionally filter by officer status.
        Cached for 30 seconds.
        """
        cache_key = f'dashboard:by_officer:{status}' if status else 'dashboard:by_officer'
        cached = cache.get(cache_key)
        if cached:
            return cached

        queryset = Registration.objects.select_related('officer').values(
            'officer__id',
            'officer__full_name',
            'officer__national_id',
            'officer__role'
        )

        if status:
            queryset = queryset.filter(officer__status=status)

        results = queryset.annotate(
            registrations_count=Count('id'),
            last_registration_at=F('created_at')
        ).order_by('-registrations_count')

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Format and add today's count
        data = []
        for item in results:
            officer_id = item['officer__id']
            registrations_today = Registration.objects.filter(
                officer_id=officer_id,
                created_at__gte=today_start
            ).count()

            data.append({
                'officer_id': officer_id,
                'officer_name': item['officer__full_name'],
                'national_id': item['officer__national_id'],
                'role': item['officer__role'],
                'registrations_count': item['registrations_count'],
                'registrations_today': registrations_today,
                'last_registration_at': item['last_registration_at']
            })

        cache.set(cache_key, data, DashboardService.CACHE_TTL_SHORT)
        return data

    @staticmethod
    def get_trends(days=7, start_date=None, end_date=None):
        """
        Get registration trends by day.
        Default 7 days, or custom date range.
        Cached for 5 minutes.
        """
        cache_key = f'dashboard:trends:{days}:{start_date}:{end_date}'
        cached = cache.get(cache_key)
        if cached:
            return cached

        if start_date and end_date:
            date_range = [start_date, end_date]
        else:
            end = timezone.now()
            start = end - timedelta(days=days)
            date_range = [start.date(), end.date()]

        # Get daily counts
        results = Registration.objects.filter(
            created_at__date__gte=date_range[0],
            created_at__date__lte=date_range[1]
        ).values('created_at__date').annotate(
            count=Count('id')
        ).order_by('created_at__date')

        data = [
            {
                'date': item['created_at__date'].isoformat(),
                'count': item['count']
            }
            for item in results
        ]

        cache.set(cache_key, data, DashboardService.CACHE_TTL_LONG)
        return data

    @staticmethod
    def invalidate_cache(key_pattern='dashboard:*'):
        """Invalidate dashboard cache entries."""
        cache.delete_pattern(key_pattern)

    @staticmethod
    def get_daily_breakdown():
        """Get daily breakdown report for all registrations."""
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        registrations_today = Registration.objects.filter(
            created_at__gte=today_start,
            created_at__lt=today_end
        ).count()

        return {
            'date': today_start.date().isoformat(),
            'registrations_today': registrations_today,
            'total_registered': Citizen.objects.filter(registration_status='REGISTERED').count(),
            'total_unregistered': Citizen.objects.filter(registration_status='UNREGISTERED').count(),
        }

    @staticmethod
    def get_gaps():
        """Get data gaps - locations or divisions with no registrations."""
        # Find divisions with no registrations
        cache_key = 'dashboard:gaps'
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        divisions_with_registrations = Citizen.objects.filter(
            registration_status='REGISTERED'
        ).values_list('division', flat=True).distinct()

        all_divisions = Citizen.objects.values_list('division', flat=True).distinct()
        
        gaps = [
            {'division': div, 'status': 'NO_REGISTRATIONS'}
            for div in all_divisions
            if div and div not in divisions_with_registrations
        ]

        result = {
            'total_gaps': len(gaps),
            'gaps': gaps
        }
        
        cache.set(cache_key, result, DashboardService.CACHE_TTL_SHORT)
        return result

    @staticmethod
    def get_verify_stats():
        """Get verification statistics."""
        cache_key = 'dashboard:verify_stats'
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        total_citizens = Citizen.objects.count()
        verified = Citizen.objects.filter(registration_status='REGISTERED').count()
        unverified = Citizen.objects.filter(registration_status='UNREGISTERED').count()

        result = {
            'total_citizens': total_citizens,
            'verified_count': verified,
            'unverified_count': unverified,
            'verification_percentage': (verified / total_citizens * 100) if total_citizens > 0 else 0
        }
        
        cache.set(cache_key, result, DashboardService.CACHE_TTL_SHORT)
        return result

    @staticmethod
    def get_exports(limit=100):
        """Get list of recent exports with pagination."""
        cache_key = f'dashboard:exports:{limit}'
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        limit = min(limit, 1000)  # Cap at 1000 to prevent huge queries
        exports = Registration.objects.select_related('citizen', 'officer').order_by('-created_at')[:limit]
        
        export_list = []
        for e in exports:
            try:
                citizen_name = e.citizen.full_name if e.citizen else 'Unknown'
            except Exception:
                citizen_name = 'Unknown'
            export_list.append({
                'id': e.id,
                'citizen_name': citizen_name,
                'registered_at': e.created_at.isoformat(),
                'officer_name': e.officer.full_name if e.officer else 'Unknown',
            })
        
        result = {
            'total_exports': limit,
            'count': len(export_list),
            'exports': export_list
        }
        
        cache.set(cache_key, result, DashboardService.CACHE_TTL_SHORT)
        return result
