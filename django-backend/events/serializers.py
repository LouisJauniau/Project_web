from rest_framework import serializers
from .models import Event, Participant, Registration


class EventSerializer(serializers.ModelSerializer):

    class Meta:
        model = Event
        fields = '__all__'


class ParticipantSerializer(serializers.ModelSerializer):

    class Meta:
        model = Participant
        fields = '__all__'


class RegistrationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Registration
        fields = '__all__'

    def validate(self, data):

        participant = data['participant']
        event = data['event']

        if Registration.objects.filter(
            participant=participant,
            event=event
        ).exists():

            raise serializers.ValidationError(
                "Participant already registered for this event."
            )

        return data