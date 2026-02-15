from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()


class LoginTokenObtainPairSerializer(TokenObtainPairSerializer):
    login = serializers.CharField(write_only=True, required=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Keep backward compatibility for clients posting email directly.
        self.fields[self.username_field].required = False

    def validate(self, attrs):
        login = attrs.pop('login', None) or attrs.get(self.username_field)
        password = attrs.get('password')

        if not login or not password:
            raise AuthenticationFailed('Login and password are required.')

        if '@' in login:
            user = User.objects.filter(email__iexact=login).first()
        else:
            user = User.objects.filter(username__iexact=login).first()

        if not user:
            raise AuthenticationFailed('Invalid credentials.')

        attrs[self.username_field] = user.email
        return super().validate(attrs)


class LoginTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginTokenObtainPairSerializer
