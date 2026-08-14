"""
Rate Limiting for Login Attempts
Uses Redis to track login attempts per IP address.
Locks account after 5 failed attempts within 15 minutes.
"""

from django.core.cache import cache
from datetime import timedelta


class RateLimiter:
    """Rate limiting for login attempts."""

    FAILED_ATTEMPTS_KEY = 'sdics:failed_logins:{}'
    RATE_LIMIT_THRESHOLD = 5
    RATE_LIMIT_WINDOW = 900  # 15 minutes in seconds

    @staticmethod
    def check_login_rate_limit(ip_address):
        """
        Check if IP address is rate limited.
        Returns True if allowed, False if rate limited.
        """
        key = RateLimiter.FAILED_ATTEMPTS_KEY.format(ip_address)
        attempts = cache.get(key, 0)
        return attempts < RateLimiter.RATE_LIMIT_THRESHOLD

    @staticmethod
    def record_failed_login(ip_address):
        """Record a failed login attempt."""
        key = RateLimiter.FAILED_ATTEMPTS_KEY.format(ip_address)
        attempts = cache.get(key, 0)
        cache.set(key, attempts + 1, RateLimiter.RATE_LIMIT_WINDOW)

    @staticmethod
    def reset_login_counter(ip_address):
        """Reset login counter after successful login."""
        key = RateLimiter.FAILED_ATTEMPTS_KEY.format(ip_address)
        cache.delete(key)

    @staticmethod
    def get_remaining_attempts(ip_address):
        """Get remaining login attempts."""
        key = RateLimiter.FAILED_ATTEMPTS_KEY.format(ip_address)
        attempts = cache.get(key, 0)
        return max(0, RateLimiter.RATE_LIMIT_THRESHOLD - attempts)

    @staticmethod
    def get_retry_after(ip_address):
        """Get seconds until rate limit expires."""
        key = RateLimiter.FAILED_ATTEMPTS_KEY.format(ip_address)
        ttl = cache.ttl(key) if hasattr(cache, 'ttl') else None
        return ttl or RateLimiter.RATE_LIMIT_WINDOW
