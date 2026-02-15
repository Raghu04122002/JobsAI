from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import SignupViewSet
from accounts.token_views import LoginTokenObtainPairView
from applications.views import ApplicationViewSet
from ai_engine.views import CopilotViewSet, AnalysisResultViewSet
from chat.views import ChatSessionViewSet
from jobs.views import JobDescriptionViewSet
from resumes.views import ResumeViewSet

router = DefaultRouter()
router.register(r'auth/signup', SignupViewSet, basename='signup')
router.register(r'resumes', ResumeViewSet, basename='resumes')
router.register(r'jobs', JobDescriptionViewSet, basename='jobs')
router.register(r'applications', ApplicationViewSet, basename='applications')
router.register(r'chat', ChatSessionViewSet, basename='chat')
router.register(r'copilot', CopilotViewSet, basename='copilot')
router.register(r'analysis-results', AnalysisResultViewSet, basename='analysis-results')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', LoginTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
