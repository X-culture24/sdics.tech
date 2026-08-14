"""
WebSocket consumers for real-time dashboard updates.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.core.exceptions import ValidationError


class DashboardConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time dashboard metric updates.
    Authenticates using JWT token and broadcasts metrics every 5 seconds.
    """

    async def connect(self):
        """Handle WebSocket connection."""
        # Get token from URL query string
        query_string = self.scope.get('query_string', b'').decode()
        try:
            token = self._get_token_from_query(query_string)
            await self._authenticate_token(token)
            
            # Add to dashboard group
            await self.channel_layer.group_add('dashboard_updates', self.channel_name)
            await self.accept()
            
            # Send initial metrics
            await self.send_metrics()
        except Exception as e:
            await self.close()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        await self.channel_layer.group_discard('dashboard_updates', self.channel_name)

    async def receive(self, text_data):
        """Handle incoming message from client."""
        try:
            data = json.loads(text_data)
            if data.get('action') == 'refresh_metrics':
                await self.send_metrics()
        except Exception:
            pass

    async def send_metrics(self):
        """Send dashboard metrics to client."""
        metrics = await self._get_dashboard_metrics()
        await self.send(text_data=json.dumps({
            'type': 'metrics_update',
            'data': metrics
        }))

    async def metrics_broadcast(self, event):
        """Broadcast handler for metrics updates."""
        await self.send(text_data=json.dumps(event['data']))

    @staticmethod
    def _get_token_from_query(query_string: str) -> str:
        """Extract token from query string."""
        params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        token = params.get('token')
        if not token:
            raise ValueError("No token provided")
        return token

    @database_sync_to_async
    def _authenticate_token(self, token: str):
        """Authenticate JWT token."""
        try:
            AccessToken(token)
        except Exception:
            raise ValidationError("Invalid or expired token")

    @database_sync_to_async
    def _get_dashboard_metrics(self):
        """Get current dashboard metrics."""
        from .models import Citizen, Registration
        
        total_citizens = Citizen.objects.count()
        registered_count = Citizen.objects.filter(registration_status='REGISTERED').count()
        unregistered_count = total_citizens - registered_count
        
        return {
            'total_citizens': total_citizens,
            'registered_count': registered_count,
            'unregistered_count': unregistered_count,
            'registration_percentage': round((registered_count / total_citizens * 100) if total_citizens > 0 else 0, 2),
        }
