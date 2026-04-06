from django.apps import AppConfig
from django.db.models.signals import post_migrate
from .bootstrap import bootstrap_superadmin

class EventsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'events'

    def ready(self):

        post_migrate.connect(bootstrap_superadmin, sender=self, dispatch_uid='events.bootstrap_superadmin')
