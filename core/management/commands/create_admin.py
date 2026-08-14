"""
Management command to create an admin user for SDICS.
Creates both a Django superuser (for admin login via email/password)
and an Officer record with ADMINISTRATOR role.

Usage:
    python manage.py create_admin --email admin@example.com --password "StrongPass123" --name "System Admin"
    python manage.py create_admin  # Interactive mode
"""

import getpass
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from core.models import Officer
from core.services.auth_service import AuthService


class Command(BaseCommand):
    help = 'Create an SDICS administrator account (Django superuser + ADMINISTRATOR Officer)'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email (used for login and officer national_id)')
        parser.add_argument('--password', type=str, help='Admin password (min 8 chars)')
        parser.add_argument('--name', type=str, help='Admin full name')
        parser.add_argument('--phone', type=str, default='', help='Admin phone number (optional)')
        parser.add_argument('--no-input', action='store_true', help='Non-interactive mode (requires --email, --password, --name)')

    def handle(self, *args, **options):
        email = options.get('email')
        password = options.get('password')
        name = options.get('name')
        phone = options.get('phone', '')
        no_input = options.get('no_input', False)

        # --- Interactive prompts if not provided ---
        if not no_input:
            if not email:
                email = input('Email address: ').strip()
            if not name:
                name = input('Full name: ').strip()
            if not password:
                while True:
                    p1 = getpass.getpass('Password (min 8 chars): ')
                    p2 = getpass.getpass('Confirm password: ')
                    if p1 == p2:
                        if len(p1) < 8:
                            self.stderr.write(self.style.ERROR('Password must be at least 8 characters.'))
                            continue
                        password = p1
                        break
                    self.stderr.write(self.style.ERROR('Passwords do not match. Try again.'))

        # --- Validation for no-input mode ---
        if not email or not password or not name:
            raise CommandError('--email, --password, and --name are required in --no-input mode.')

        if len(password) < 8:
            raise CommandError('Password must be at least 8 characters long.')

        email = email.strip().lower()
        name = name.strip()

        # --- Create / update Django superuser ---
        user_created = False
        user_updated = False
        try:
            user = User.objects.get(email=email)
            # User exists - update password if provided
            if not user.check_password(password):
                user.set_password(password)
                user_updated = True
            if not user.is_superuser:
                user.is_superuser = True
                user_updated = True
            if not user.is_staff:
                user.is_staff = True
                user_updated = True
            if not user.is_active:
                user.is_active = True
                user_updated = True
            if user.get_full_name() != name:
                user.first_name = name.split(' ', 1)[0] if ' ' in name else name
                user.last_name = name.split(' ', 1)[1] if ' ' in name else ''
                user_updated = True
            if user.username != email:
                user.username = email
                user_updated = True
            if user_updated:
                user.save()
        except User.DoesNotExist:
            # Create new superuser
            first_name = name.split(' ', 1)[0] if ' ' in name else name
            last_name = name.split(' ', 1)[1] if ' ' in name else ''
            user = User.objects.create_superuser(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
            user_created = True

        # --- Create / update Officer record ---
        officer_created = False
        officer_updated = False
        try:
            officer = Officer.objects.get(national_id=email)
            if officer.full_name != name:
                officer.full_name = name
                officer_updated = True
            if officer.role != 'ADMINISTRATOR':
                officer.role = 'ADMINISTRATOR'
                officer_updated = True
            if officer.status != 'ACTIVE':
                officer.status = 'ACTIVE'
                officer_updated = True
            if phone and officer.phone != phone:
                officer.phone = phone
                officer_updated = True
            if officer_updated:
                officer.save()
        except Officer.DoesNotExist:
            officer = Officer.objects.create(
                national_id=email,
                full_name=name,
                phone=phone,
                role='ADMINISTRATOR',
                status='ACTIVE',
                pin_hash=AuthService.hash_pin('00000000'),
            )
            officer_created = True

        # --- Summary output ---
        self.stdout.write(self.style.SUCCESS('\n=== Admin Account Setup Complete ==='))
        self.stdout.write(f'  Email:        {email}')
        self.stdout.write(f'  Name:         {name}')
        self.stdout.write(f'  Role:         ADMINISTRATOR')
        if user_created:
            self.stdout.write(self.style.SUCCESS('  Django user:  CREATED'))
        elif user_updated:
            self.stdout.write(self.style.WARNING('  Django user:  UPDATED'))
        else:
            self.stdout.write('  Django user:  OK (already configured)')
        if officer_created:
            self.stdout.write(self.style.SUCCESS('  Officer rec:  CREATED'))
        elif officer_updated:
            self.stdout.write(self.style.WARNING('  Officer rec:  UPDATED'))
        else:
            self.stdout.write('  Officer rec:  OK (already configured)')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'You can now login at /login/admin with email="{email}" and your chosen password.'))
