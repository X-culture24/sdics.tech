"""
Utility functions for SDICS.
"""

import bcrypt
import string
import secrets
from datetime import datetime


def hash_pin(pin: str) -> str:
    """
    Hash a PIN using bcrypt (never store plaintext).
    
    Args:
        pin: The PIN to hash (string)
        
    Returns:
        bcrypt hashed PIN
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pin.encode(), salt).decode()


def verify_pin(pin: str, pin_hash: str) -> bool:
    """
    Verify a PIN against a bcrypt hash.
    
    Args:
        pin: The PIN to verify
        pin_hash: The bcrypt hash to verify against
        
    Returns:
        True if PIN matches, False otherwise
    """
    return bcrypt.checkpw(pin.encode(), pin_hash.encode())


def generate_system_pin() -> str:
    """
    Generate a secure system PIN (6 characters: digits + uppercase).
    
    Returns:
        6-character alphanumeric PIN
    """
    alphabet = string.digits + string.ascii_uppercase
    return ''.join(secrets.choice(alphabet) for _ in range(6))


def get_client_ip(request) -> str:
    """
    Extract client IP address from request.
    
    Args:
        request: Django HTTP request
        
    Returns:
        Client IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def get_user_agent(request) -> str:
    """Extract user agent from request."""
    return request.META.get('HTTP_USER_AGENT', '')
