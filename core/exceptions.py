"""
Custom exception classes and error handling for SDICS API.
Provides standardized error response format with request IDs.
"""

import uuid
from rest_framework.views import exception_handler
from rest_framework.response import Response


class SDICSException(Exception):
    """Base exception for SDICS API."""
    
    def __init__(self, code, message, status_code=400, details=None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(SDICSException):
    """Raised when validation fails."""
    def __init__(self, message, details=None):
        super().__init__('VALIDATION_ERROR', message, 400, details)


class AuthenticationError(SDICSException):
    """Raised when authentication fails."""
    def __init__(self, message):
        super().__init__('AUTH_FAILED', message, 401)


class AuthorizationError(SDICSException):
    """Raised when authorization fails."""
    def __init__(self, message):
        super().__init__('FORBIDDEN', message, 403)


class NotFoundError(SDICSException):
    """Raised when resource is not found."""
    def __init__(self, message, details=None):
        super().__init__('NOT_FOUND', message, 404, details)


class ConflictError(SDICSException):
    """Raised when there's a conflict (e.g., duplicate)."""
    def __init__(self, message, details=None):
        super().__init__('CONFLICT', message, 409, details)


class RateLimitError(SDICSException):
    """Raised when rate limit exceeded."""
    def __init__(self, message, retry_after=None):
        super().__init__('RATE_LIMITED', message, 429, {'retry_after': retry_after})


class InternalServerError(SDICSException):
    """Raised for internal server errors."""
    def __init__(self, message, request_id=None):
        super().__init__('SERVER_ERROR', message, 500, {'request_id': request_id or str(uuid.uuid4())})


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF.
    Returns standardized error response format.
    """
    request_id = str(uuid.uuid4())
    
    # Handle SDICS custom exceptions
    if isinstance(exc, SDICSException):
        return Response(
            {
                'error': {
                    'code': exc.code,
                    'message': exc.message,
                    'details': exc.details,
                    'request_id': request_id,
                }
            },
            status=exc.status_code
        )
    
    # Handle DRF exceptions
    response = exception_handler(exc, context)
    
    if response is not None:
        # Format DRF exception response
        return Response(
            {
                'error': {
                    'code': 'VALIDATION_ERROR' if response.status_code == 400 else 'SERVER_ERROR',
                    'message': str(response.data) if response.data else 'An error occurred',
                    'details': response.data if isinstance(response.data, dict) else {},
                    'request_id': request_id,
                }
            },
            status=response.status_code
        )
    
    # Handle unexpected exceptions
    return Response(
        {
            'error': {
                'code': 'SERVER_ERROR',
                'message': 'An unexpected error occurred',
                'request_id': request_id,
            }
        },
        status=500
    )
