from rest_framework import mixins, permissions, viewsets

from .serializers import SignupSerializer


class SignupViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]
