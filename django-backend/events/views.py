from typing import Any, Mapping, cast

from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, Participant, Registration
from .permissions import IsAdminOrReadOnly, IsAdminUserOnly
from .serializers import (
    AdminUserCreateSerializer,
    EventSerializer,
    LoginSerializer,
    ParticipantSerializer,
    RegistrationSerializer,
    SignupSerializer,
    UserSerializer,
)


User = get_user_model()


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = cast(Mapping[str, Any], serializer.validated_data)

        user = authenticate(
            request,
            username=cast(str, validated_data['username']),
            password=cast(str, validated_data['password']),
        )

        if not user:
            raise ValidationError({'error': 'Invalid username or password.'})

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = cast(Mapping[str, Any], serializer.validated_data)

        user = User.objects.create_user(
            username=cast(str, validated_data['username']),
            password=cast(str, validated_data['password']),
            is_staff=False,
        )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class UserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserOnly]

    def get(self, request):
        users = User.objects.all().order_by('username')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = cast(Mapping[str, Any], serializer.validated_data)

        user = User.objects.create_user(
            username=cast(str, validated_data['username']),
            password=cast(str, validated_data['password']),
            is_staff=cast(bool, validated_data.get('is_staff', False)),
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserPromoteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserOnly]

    def post(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        if not user.is_staff:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
        return Response(UserSerializer(user).data)


class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserOnly]

    def delete(self, request, user_id):
        user = get_object_or_404(User, pk=user_id)
        if user.pk == request.user.pk:
            raise PermissionDenied('You cannot delete your own account.')
        if user.is_superuser:
            raise PermissionDenied('You cannot delete a superuser account.')
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        from django.utils import timezone
        queryset = super().get_queryset()
        status_value = self.request.query_params.get('status')
        date_value = self.request.query_params.get('date')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_value:
            now = timezone.now()
            if status_value == 'completed':
                queryset = queryset.filter(date__lt=now)
            elif status_value == 'upcoming':
                queryset = queryset.filter(date__gte=now)

        if date_value:
            parsed_date = parse_date(date_value)
            if parsed_date:
                queryset = queryset.filter(date__date=parsed_date)

        if date_from:
            parsed_date = parse_date(date_from)
            if parsed_date:
                queryset = queryset.filter(date__date__gte=parsed_date)

        if date_to:
            parsed_date = parse_date(date_to)
            if parsed_date:
                queryset = queryset.filter(date__date__lte=parsed_date)

        return queryset


class ParticipantViewSet(viewsets.ModelViewSet):
    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer
    permission_classes = [IsAdminOrReadOnly]


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related('participant', 'event').all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        event_id = self.request.query_params.get('event')
        participant_id = self.request.query_params.get('participant')

        if event_id:
            queryset = queryset.filter(event_id=event_id)
        if participant_id:
            queryset = queryset.filter(participant_id=participant_id)

        return queryset
