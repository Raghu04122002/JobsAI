from rest_framework import permissions, response, status, viewsets
from rest_framework.decorators import action

from jobs.models import JobDescription
from resumes.models import Resume

from .serializers import AnalyzeRequestSerializer, MatchRequestSerializer, TailorRequestSerializer
from .services.crag import CRAGService


class CopilotViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def analyze(self, request):
        serializer = AnalyzeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data['query']
        top_k = serializer.validated_data['top_k']

        crag = CRAGService(max_retries=2)
        contexts = crag.retry_logic(user_id=request.user.id, question=query, top_k=top_k)
        data = crag.generate_answer(question=query, contexts=contexts, mode='analysis')
        return response.Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def tailor(self, request):
        serializer = TailorRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data.get('query')
        top_k = serializer.validated_data['top_k']
        resume_id = serializer.validated_data.get('resume_id')
        job_id = serializer.validated_data.get('job_id')

        crag = CRAGService(max_retries=2)

        if resume_id and job_id:
            resume = Resume.objects.filter(id=resume_id, user=request.user).first()
            job = JobDescription.objects.filter(id=job_id, user=request.user).first()
            if not resume or not job:
                return response.Response({'detail': 'Resume or job not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            data = crag.tailor_resume_job(resume_text=resume.extracted_text, job_text=job.description)
            return response.Response(data, status=status.HTTP_200_OK)

        # Fallback to query-based retrieval if IDs not provided
        if not query:
             return response.Response({'detail': 'Query is required if resume_id/job_id are missing.'}, status=status.HTTP_400_BAD_REQUEST)

        contexts = crag.retry_logic(user_id=request.user.id, question=query, top_k=top_k)
        data = crag.generate_answer(question=query, contexts=contexts, mode='tailor')
        return response.Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def match(self, request):
        serializer = MatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resume = Resume.objects.filter(id=serializer.validated_data['resume_id'], user=request.user).first()
        job = JobDescription.objects.filter(id=serializer.validated_data['job_id'], user=request.user).first()
        if not resume or not job:
            return response.Response({'detail': 'Resume or job not found.'}, status=status.HTTP_404_NOT_FOUND)

        crag = CRAGService(max_retries=2)
        data = crag.match_resume_job(resume_text=resume.extracted_text, job_text=job.description)
        return response.Response(data, status=status.HTTP_200_OK)
