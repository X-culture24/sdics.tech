"""
URL configuration for core app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'officers', views.OfficerViewSet)
router.register(r'citizens', views.CitizenViewSet)
router.register(r'campaigns', views.CampaignViewSet)
router.register(r'registrations', views.RegistrationViewSet)
router.register(r'audit-logs', views.AuditLogViewSet)
router.register(r'import-logs', views.ImportLogViewSet)

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/admin-login/', views.AdminLoginView.as_view(), name='admin_login'),
    path('auth/refresh/', views.RefreshTokenView.as_view(), name='token_refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/change-pin/', views.ChangePinView.as_view(), name='change_pin'),
    
    # Dashboard endpoints
    path('dashboard/summary/', views.DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('dashboard/by-county/', views.DashboardByCountyView.as_view(), name='dashboard_by_county'),
    path('dashboard/by-district/', views.DashboardByDistrictView.as_view(), name='dashboard_by_district'),
    path('dashboard/by-officer/', views.DashboardByOfficerView.as_view(), name='dashboard_by_officer'),
    path('dashboard/trends/', views.DashboardTrendsView.as_view(), name='dashboard_trends'),
    
    # Reports, Gaps, Verify, Exports
    path('reports/', views.ReportsView.as_view(), name='reports'),
    path('gaps/', views.GapsView.as_view(), name='gaps'),
    path('verify/', views.VerifyView.as_view(), name='verify'),
    path('exports/', views.ExportsView.as_view(), name='exports'),
    
    # Router endpoints (includes citizens geographic hierarchy)
    path('', include(router.urls)),
]
