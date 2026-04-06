from django.db import models
from django.utils import timezone


class Event(models.Model):
    STATUS_UPCOMING = 'upcoming'
    STATUS_COMPLETED = 'completed'

    STATUS_CHOICES = [
        (STATUS_UPCOMING, 'Upcoming'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200)
    date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPCOMING)

    class Meta:
        ordering = ['date', 'title']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.status = self.STATUS_COMPLETED if self.date < timezone.now() else self.STATUS_UPCOMING
        super().save(*args, **kwargs)


class Participant(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f'{self.first_name} {self.last_name}'


class Registration(models.Model):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, related_name='registrations')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['participant', 'event'], name='unique_participant_event_registration'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.participant} -> {self.event}'
