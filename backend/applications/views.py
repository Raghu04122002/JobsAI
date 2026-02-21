from rest_framework import permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone

from core.permissions import IsOwner
from jobs.models import JobDescription

from .models import Application
from .serializers import ApplicationSerializer


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='from-job')
    def from_job(self, request):
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({"error": "job_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        job = get_object_or_404(JobDescription, id=job_id, user=request.user)
        
        app = Application.objects.create(
            user=request.user,
            company=job.company,
            role=job.role,
            status=Application.Status.APPLIED,
            applied_date=timezone.now().date(),
            job_link=job.apply_url[:500] if job.apply_url else ''
        )
        
        serializer = self.get_serializer(app)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
