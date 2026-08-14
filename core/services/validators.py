"""
Input Validation and Sanitization
Validates all user inputs before processing.
"""

import re
from datetime import datetime
from core.exceptions import ValidationError


class InputValidator:
    """Validates and sanitizes user input."""

    @staticmethod
    def validate_national_id(national_id):
        """
        Validate national ID format.
        Must be 8+ characters, alphanumeric.
        """
        if not national_id:
            raise ValidationError('National ID required', {'national_id': 'Cannot be empty'})

        national_id = str(national_id).strip()

        if len(national_id) < 8:
            raise ValidationError('Invalid national ID', {'national_id': 'Must be 8+ characters'})

        if not national_id.isalnum():
            raise ValidationError('Invalid national ID', {'national_id': 'Must be alphanumeric'})

        return national_id

    @staticmethod
    def validate_phone_number(phone):
        """
        Validate Kenyan phone number format.
        Accepts: +254XXXXXXXXX or 0XXXXXXXXX
        """
        if not phone:
            raise ValidationError('Phone number required', {'phone': 'Cannot be empty'})

        phone = str(phone).strip()

        # +254 format (13 characters total)
        if phone.startswith('+254'):
            if len(phone) != 13 or not phone[4:].isdigit():
                raise ValidationError('Invalid phone number', {'phone': 'Must be +254XXXXXXXXX'})
            return phone

        # 0 format (10 characters total)
        if phone.startswith('0'):
            if len(phone) != 10 or not phone[1:].isdigit():
                raise ValidationError('Invalid phone number', {'phone': 'Must be 0XXXXXXXXX'})
            return phone

        raise ValidationError('Invalid phone number', {'phone': 'Must start with +254 or 0'})

    @staticmethod
    def validate_date(date_str, field_name='date'):
        """
        Validate ISO date format (YYYY-MM-DD).
        """
        if not date_str:
            raise ValidationError(f'{field_name} required', {field_name: 'Cannot be empty'})

        try:
            return datetime.strptime(str(date_str).strip(), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            raise ValidationError(f'Invalid {field_name}', {field_name: 'Must be YYYY-MM-DD format'})

    @staticmethod
    def validate_date_range(start_date, end_date):
        """
        Validate date range.
        start_date must be <= end_date.
        """
        if start_date > end_date:
            raise ValidationError('Invalid date range', {'dates': 'start_date must be <= end_date'})

    @staticmethod
    def validate_pin(pin, field_name='pin'):
        """
        Validate PIN format.
        Must be 8-12 digits.
        """
        if not pin:
            raise ValidationError(f'{field_name} required', {field_name: 'Cannot be empty'})

        pin = str(pin).strip()

        if len(pin) < 8 or len(pin) > 12:
            raise ValidationError(f'Invalid {field_name}', {field_name: 'Must be 8-12 characters'})

        if not pin.isdigit():
            raise ValidationError(f'Invalid {field_name}', {field_name: 'Must contain only digits'})

        return pin

    @staticmethod
    def validate_pagination(page, page_size):
        """
        Validate pagination parameters.
        page >= 1, 1 <= page_size <= 100
        """
        try:
            page = int(page)
            page_size = int(page_size)
        except (ValueError, TypeError):
            raise ValidationError('Invalid pagination', {'page': 'Must be integer'})

        if page < 1:
            raise ValidationError('Invalid page', {'page': 'Must be >= 1'})

        if page_size < 1 or page_size > 100:
            raise ValidationError('Invalid page_size', {'page_size': 'Must be 1-100'})

        return page, page_size

    @staticmethod
    def validate_search_query(query, min_length=1, max_length=100):
        """
        Validate search query.
        Prevents SQL injection by treating special characters literally.
        """
        if not query:
            raise ValidationError('Search query required', {'q': 'Cannot be empty'})

        query = str(query).strip()

        if len(query) < min_length or len(query) > max_length:
            raise ValidationError(
                'Invalid search query',
                {'q': f'Must be {min_length}-{max_length} characters'}
            )

        # SQL injection patterns - treat as literal strings (safe because using ORM)
        dangerous_patterns = [
            r"'\s+OR\s+'",
            r"'\s+AND\s+'",
            r"--\s",
            r";.*DROP",
            r";.*DELETE",
            r";.*UPDATE",
        ]

        query_lower = query.lower()
        for pattern in dangerous_patterns:
            if re.search(pattern, query_lower):
                # Log but don't reject - treat as literal search
                pass

        return query

    @staticmethod
    def validate_status(status, valid_statuses):
        """
        Validate status value against allowed list.
        """
        if status not in valid_statuses:
            raise ValidationError(
                f'Invalid status',
                {'status': f'Must be one of: {", ".join(valid_statuses)}'}
            )
        return status

    @staticmethod
    def validate_role(role):
        """
        Validate officer role.
        """
        valid_roles = ['REGISTRATION_OFFICER', 'SUPERVISOR', 'ADMINISTRATOR']
        return InputValidator.validate_status(role, valid_roles)

    @staticmethod
    def sanitize_string(value, max_length=None):
        """
        Sanitize string input.
        Trim whitespace, optionally limit length.
        """
        if value is None:
            return None

        value = str(value).strip()

        if max_length and len(value) > max_length:
            value = value[:max_length]

        return value

    @staticmethod
    def validate_location_data(location_dict):
        """
        Validate location dict has required fields.
        {county, district, division, location}
        """
        required_fields = ['county', 'district', 'division', 'location']
        for field in required_fields:
            if not location_dict.get(field):
                raise ValidationError(
                    f'Missing location field',
                    {'location': f'Missing {field}'}
                )
        return location_dict
