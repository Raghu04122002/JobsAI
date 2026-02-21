import logging

from rest_framework import permissions, viewsets
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.permissions import IsOwner

from .models import JobDescription
from .serializers import JobDescriptionSerializer
from .services.jsearch import fetch_jobs

logger = logging.getLogger(__name__)


class JobDescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = JobDescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return JobDescription.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AutoImportThrottle(UserRateThrottle):
    rate = '5/min'


class AutoImportJobsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AutoImportThrottle]

    def post(self, request):
        role = request.data.get("role", "").strip()
        location = request.data.get("location", "").strip()
        experience_level = request.data.get("experience_level")
        
        try:
            page = int(request.data.get("page", 1))
        except ValueError:
            page = 1
            
        if page > 5:
            page = 5

        if not role or not location:
            return Response(
                {"detail": "Both 'role' and 'location' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            jobs = fetch_jobs(role, location, experience_level, page)
        except ValueError as e:
            logger.error("JSearch config error: %s", e)
            return Response(
                {"detail": "Job search service is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            logger.exception("JSearch API error: %s", e)
            return Response(
                {"detail": "Failed to fetch jobs. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        created = 0
        for job in jobs:
            _, was_created = JobDescription.objects.get_or_create(
                user=request.user,
                role=job["role"],
                company=job["company"],
                defaults={
                    "description": job["description"],
                    "location": job["location"],
                    "apply_url": job["apply_url"],
                    "source": job["source"],
                },
            )
            if was_created:
                created += 1

        has_more = len(jobs) >= 20
        return Response({
            "imported": created, 
            "total_found": len(jobs),
            "page": page,
            "has_more": has_more
        })
