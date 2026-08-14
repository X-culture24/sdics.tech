"""
ASGI config for SDICS project.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sdics.settings')

django_asgi_app = get_asgi_application()

# Import consumers after Django setup
from core.consumers import DashboardConsumer
from django.urls import path

websocket_urlpatterns = [
    path('ws/dashboard/', AuthMiddlewareStack(
        URLRouter([
            path('ws/dashboard/', DashboardConsumer.as_asgi()),
        ])
    )),
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
