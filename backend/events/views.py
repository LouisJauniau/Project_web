from rest_framework import viewsets
from .models import Event, Participant, Registration
from .serializers import (
    EventSerializer,
    ParticipantSerializer,
    RegistrationSerializer
)


class EventViewSet(viewsets.ModelViewSet):

    queryset = Event.objects.all()
    serializer_class = EventSerializer


class ParticipantViewSet(viewsets.ModelViewSet):

    queryset = Participant.objects.all()
    serializer_class = ParticipantSerializer


class RegistrationViewSet(viewsets.ModelViewSet):

    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer