from django.contrib import admin

from .models import Event, Participant, Registration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'status', 'location')
    list_filter = ('date',)
    search_fields = ('title', 'location', 'description')


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email')
    search_fields = ('first_name', 'last_name', 'email')


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('participant', 'event', 'created_at')
    list_filter = ('event', 'created_at')
    search_fields = ('participant__first_name', 'participant__last_name', 'event__title')
