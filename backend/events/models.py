from django.db import models


class Event(models.Model):

    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField()
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    def __str__(self):
        return self.title


class Participant(models.Model):

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Registration(models.Model):

    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name="registrations"
    )

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="registrations"
    )

    registration_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('participant', 'event')

    def __str__(self):
        return f"{self.participant} -> {self.event}"