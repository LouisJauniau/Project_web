from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError


def bootstrap_superadmin(*args, **kwargs):
    """Create the bootstrap superadmin from environment settings if missing."""
    username = (getattr(settings, 'SUPERADMIN_USERNAME', '') or '').strip()
    password = (getattr(settings, 'SUPERADMIN_PASSWORD', '') or '').strip()
    email = (getattr(settings, 'SUPERADMIN_EMAIL', '') or '').strip()

    if not username or not password:
        return

    User = get_user_model()

    try:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
            },
        )
    except (OperationalError, ProgrammingError):
        return

    if created:
        user.set_password(password)
        user.save(update_fields=['password'])
        return

    updates = []
    if not user.is_staff:
        user.is_staff = True
        updates.append('is_staff')
    if not user.is_superuser:
        user.is_superuser = True
        updates.append('is_superuser')
    if email and user.email != email:
        user.email = email
        updates.append('email')

    if updates:
        user.save(update_fields=updates)
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.utils import OperationalError, ProgrammingError


def ensure_bootstrap_superadmin():
    """Create the bootstrap superadmin from environment settings if missing."""
    username = (getattr(settings, 'SUPERADMIN_USERNAME', '') or '').strip()
    password = (getattr(settings, 'SUPERADMIN_PASSWORD', '') or '').strip()
    email = (getattr(settings, 'SUPERADMIN_EMAIL', '') or '').strip()

    if not username or not password:
        return

    User = get_user_model()

    try:
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'is_staff': True,
                'is_superuser': True,
            },
        )
    except (OperationalError, ProgrammingError):
        # In case database isn't yet ready because it's during early startup or initial migration.
        return

    if created:
        user.set_password(password)
        user.save(update_fields=['password'])
        return

    updates = []
    if not user.is_staff:
        user.is_staff = True
        updates.append('is_staff')
    if not user.is_superuser:
        user.is_superuser = True
        updates.append('is_superuser')
    if email and user.email != email:
        user.email = email
        updates.append('email')

    if updates:
        user.save(update_fields=updates)
