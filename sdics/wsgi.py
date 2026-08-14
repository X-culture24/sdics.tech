"""
WSGI config for SDICS project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sdics.settings')

application = get_wsgi_application()
