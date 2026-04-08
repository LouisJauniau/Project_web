from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Event, Participant, Registration


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'is_staff')


class EventSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ('id', 'title', 'description', 'location', 'date', 'status')

    def get_status(self, obj):
        return obj.status


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participant
        fields = ('id', 'first_name', 'last_name', 'email')


class RegistrationSerializer(serializers.ModelSerializer):
    participant_details = ParticipantSerializer(source='participant', read_only=True)
    event_details = EventSerializer(source='event', read_only=True)

    class Meta:
        model = Registration
        fields = ('id', 'participant', 'event', 'created_at', 'participant_details', 'event_details')
        read_only_fields = ('created_at',)
        validators = []

    def validate(self, attrs):
        participant = attrs.get('participant') or getattr(self.instance, 'participant', None)
        event = attrs.get('event') or getattr(self.instance, 'event', None)

        if participant and event:
            exists = Registration.objects.filter(participant=participant, event=event)
            if self.instance:
                exists = exists.exclude(pk=self.instance.pk)
            if exists.exists():
                raise serializers.ValidationError('This participant is already registered for this event.')

        return attrs


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(trim_whitespace=False)
    password_confirmation = serializers.CharField(trim_whitespace=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate(self, attrs):
        password = attrs.get('password')
        password_confirmation = attrs.get('password_confirmation')

        if password != password_confirmation:
            raise serializers.ValidationError({'password_confirmation': 'Passwords do not match.'})

        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs


class AdminUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField()
    # Kept for backward compatibility with existing clients; ignored on create.
    email = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(trim_whitespace=False)
    is_staff = serializers.BooleanField(required=False, default=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value
