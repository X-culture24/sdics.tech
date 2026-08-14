"""
Role-Based Access Control (RBAC) System
Defines role-permission mappings and location-based restrictions.
"""

from django.http import JsonResponse
from functools import wraps


# Role permission mappings
ROLE_PERMISSIONS = {
    'REGISTRATION_OFFICER': {
        'citizen.search': True,
        'citizen.register': True,
        'officer.view_self': True,
        'dashboard.view_assigned_locations': True,
        'audit.view_own': True,
    },
    'SUPERVISOR': {
        'citizen.search': True,
        'citizen.register': True,
        'officer.list': True,
        'officer.view_self': True,
        'dashboard.view_full': True,
        'audit.view_all': True,
    },
    'ADMINISTRATOR': {
        'citizen.search': True,
        'citizen.register': True,
        'officer.create': True,
        'officer.list': True,
        'officer.update': True,
        'officer.deactivate': True,
        'officer.view_self': True,
        'dashboard.view_full': True,
        'audit.view_all': True,
        'campaign.create': True,
        'campaign.update': True,
    }
}


class RBACChecker:
    """Handles role-based access control checking and enforcement."""

    @staticmethod
    def has_permission(officer, permission):
        """Check if officer has the required permission."""
        if not officer:
            return False
        
        role = officer.role
        return ROLE_PERMISSIONS.get(role, {}).get(permission, False)

    @staticmethod
    def can_access_location(officer, location_context):
        """
        Check if officer can access a specific location.
        Admins can access all locations.
        Non-admins can only access their assigned locations.
        """
        if officer.role == 'ADMINISTRATOR':
            return True
        
        assigned_counties = set(
            officer.assigned_locations.values_list('county', flat=True)
        )
        return location_context.get('county') in assigned_counties

    @staticmethod
    def can_access_officer(requester, target_officer):
        """Check if requester can access target officer's details."""
        if requester.role == 'ADMINISTRATOR':
            return True
        
        if requester.id == target_officer.id:
            return True
        
        if requester.role == 'SUPERVISOR':
            # Supervisors can see officers in their assigned locations
            requester_counties = set(
                requester.assigned_locations.values_list('county', flat=True)
            )
            target_counties = set(
                target_officer.assigned_locations.values_list('county', flat=True)
            )
            return bool(requester_counties & target_counties)
        
        return False


def require_permission(permission):
    """Decorator to check permission on view methods."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not RBACChecker.has_permission(request.officer, permission):
                return JsonResponse(
                    {'error': {'code': 'FORBIDDEN', 'message': 'Permission denied'}},
                    status=403
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_admin():
    """Decorator to require ADMINISTRATOR role."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.officer or request.officer.role != 'ADMINISTRATOR':
                return JsonResponse(
                    {'error': {'code': 'FORBIDDEN', 'message': 'Administrator access required'}},
                    status=403
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_supervisor_or_admin():
    """Decorator to require SUPERVISOR or ADMINISTRATOR role."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.officer or request.officer.role not in ['SUPERVISOR', 'ADMINISTRATOR']:
                return JsonResponse(
                    {'error': {'code': 'FORBIDDEN', 'message': 'Supervisor access required'}},
                    status=403
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
