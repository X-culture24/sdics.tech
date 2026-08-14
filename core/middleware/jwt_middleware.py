"""
JWT Authentication Middleware and DRF Authentication Backend
Handles JWT token extraction, verification, and request enrichment.
"""

from jwt import decode, InvalidSignatureError, ExpiredSignatureError, DecodeError
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from core.models import Officer


class JWTAuthMiddleware:
    """
    Middleware to verify JWT tokens and attach officer context to requests.
    Extracts token from Authorization: Bearer <token> header.
    Verifies signature, expiry, and token type.
    Attaches officer_id, role to request, and sets request.user for DRF compatibility.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log the incoming request
        if '/auth/' in request.path:
            import logging
            logger = logging.getLogger(__name__)
            logger.debug(f'[JWT Middleware] {request.method} {request.path}')
        
        # Always allow OPTIONS (CORS preflight) requests to pass through
        if request.method == 'OPTIONS':
            return self.get_response(request)

        # Initialize officer attributes on the request (always, even if no token)
        request.officer = None
        request.officer_id = None
        request.user = AnonymousUser()

        # Extract and verify JWT if present - but DO NOT return 401 here
        # Auth enforcement is handled by DRF's IsAuthenticated permission class
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token_str = auth_header[7:]  # Remove 'Bearer ' prefix
            try:
                token = AccessToken(token_str)
                officer_id = token.get('user_id')
                
                if officer_id:
                    try:
                        officer = Officer.objects.select_related().get(id=officer_id, status='ACTIVE')
                        request.officer = officer
                        request.officer_id = officer_id
                        # Set request.user so DRF IsAuthenticated passes
                        # We create a simple proxy object with is_authenticated = True
                        request.user = _OfficerUserProxy(officer)
                    except Officer.DoesNotExist:
                        # Officer not found or inactive - leave as None, DRF will handle permission denial
                        pass
            except Exception:
                # Token expired, invalid signature, malformed, etc.
                # Leave officer as None - DRF's IsAuthenticated will trigger 401 naturally
                pass

        response = self.get_response(request)
        return response


class _OfficerUserProxy:
    """
    Proxy object that wraps an Officer and provides the minimum User interface
    needed for DRF's IsAuthenticated permission to work.
    """
    def __init__(self, officer):
        self._officer = officer
        self.is_authenticated = True
        self.is_active = officer.status == 'ACTIVE'
        self.is_staff = officer.role == 'ADMINISTRATOR'
        self.is_superuser = officer.role == 'ADMINISTRATOR'
        self.pk = officer.id
        self.id = officer.id
    
    def __getattr__(self, name):
        return getattr(self._officer, name)
    
    def __str__(self):
        return str(self._officer)

    def has_perm(self, perm, obj=None):
        return self.is_staff

    def has_module_perms(self, app_label):
        return self.is_staff


class OfficerJWTRestFrameworkAuthentication(BaseAuthentication):
    """
    Custom DRF authentication class for JWT Bearer tokens.
    Priority: 1) Use middleware-attached officer, 2) Validate JWT from header directly.
    Always sets request.officer and request.officer_id for view convenience.
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        has_bearer = auth_header.startswith('Bearer ')
        officer = None
        token_officer_id = None
        underlying_request = getattr(request, '_request', None)

        # Determine if the current view allows unauthenticated access (AllowAny).
        # DRF sets the view function/object on the request during dispatch.
        has_allow_any = False
        try:
            # Try several common ways the view might be attached
            view_obj = getattr(request, 'view', None)
            if view_obj is None:
                view_obj = getattr(request, 'cls', None)
            if view_obj is None and callable(getattr(request, 'resolver_match', None)):
                view_obj = request.resolver_match.func if request.resolver_match else None
            if view_obj is not None:
                # For function-based views or class-based views
                permission_classes = getattr(view_obj, 'permission_classes', None)
                if permission_classes is None:
                    # Class based views: check the class itself
                    permission_classes = getattr(type(view_obj), 'permission_classes', None)
                if permission_classes is None:
                    # Try the view class via view_class (DRF ViewSet)
                    permission_classes = getattr(view_obj, 'view_class', None)
                    if permission_classes is not None:
                        permission_classes = getattr(permission_classes, 'permission_classes', None)
                if permission_classes and AllowAny in permission_classes:
                    has_allow_any = True
        except Exception:
            # Silently ignore view detection issues; default to strict auth
            has_allow_any = False

        # Explicit AllowAny endpoints by URL path (safety fallback for auth endpoints)
        path = getattr(request, 'path', '') or ''
        path = path.lower()
        auth_paths = (
            '/auth/login/',
            '/auth/admin-login/',
            '/auth/refresh/',
            '/api/auth/login/',
            '/api/auth/admin-login/',
            '/api/auth/refresh/',
        )
        if any(p in path for p in auth_paths):
            has_allow_any = True

        # --- Check middleware-attached officer first ---
        if underlying_request:
            officer = getattr(underlying_request, 'officer', None)
            if officer is None:
                officer = getattr(request, 'officer', None)

        # --- Fallback: Validate token from Authorization header directly ---
        if officer is None and has_bearer:
            token_str = auth_header[7:]
            try:
                token = AccessToken(token_str)
                token_officer_id = token.get('user_id')
                if token_officer_id:
                    officer = Officer.objects.select_related().get(
                        id=token_officer_id, status='ACTIVE'
                    )
            except Officer.DoesNotExist:
                if not has_allow_any:
                    raise AuthenticationFailed('Officer not found or account inactive')
                officer = None
            except Exception:
                if not has_allow_any:
                    raise AuthenticationFailed('Invalid or expired access token')
                officer = None

        # --- If Authorization header is present but no officer was found ---
        # Only fail explicitly if the view does NOT have AllowAny
        if has_bearer and officer is None and not has_allow_any:
            raise AuthenticationFailed('Authorization token could not be validated')

        # --- Officer found: construct the response ---
        if officer is not None:
            user_proxy = _OfficerUserProxy(officer)

            # Ensure attributes are set on the UNDERLYING Django HttpRequest
            if underlying_request is not None:
                underlying_request.officer = officer
                underlying_request.officer_id = officer.id
                # Only set user if it wasn't already set correctly by middleware
                if not getattr(underlying_request.user, 'is_authenticated', False):
                    underlying_request.user = user_proxy

            # Also set directly on DRF Request wrapper for views that access it via request.officer
            try:
                request.officer = officer
                request.officer_id = officer.id
            except AttributeError:
                # Some DRF versions don't allow attribute setting; fallback is __getattr__ delegation
                pass

            return (user_proxy, officer.id)

        # --- No Bearer header, no officer found → return None
        # DRF's permission_denied logic: since authenticators list is non-empty and
        # successful_authenticator is None → raises NotAuthenticated (401) not PermissionDenied (403)
        return None

    def authenticate_header(self, request):
        return 'Bearer realm="SDICS"'


def extract_jwt_token(request):
    """Extract JWT token from Authorization header."""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None


def verify_jwt_token(token_str):
    """
    Verify JWT token and return decoded payload.
    Raises: ExpiredSignatureError, InvalidSignatureError, DecodeError
    """
    token = AccessToken(token_str)
    return token.payload
