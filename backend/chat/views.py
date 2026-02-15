from rest_framework import permissions, response, status, viewsets
from rest_framework.decorators import action

from core.permissions import IsOwner

from .models import ChatSession
from .serializers import ChatAskSerializer, ChatSessionSerializer


class ChatSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user).prefetch_related('messages')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def ask(self, request, pk=None):
        session = self.get_object()
        serializer = ChatAskSerializer(data=request.data, context={'request': request, 'session': session})
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return response.Response(payload, status=status.HTTP_200_OK)
