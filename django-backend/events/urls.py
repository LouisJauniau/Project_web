from rest_framework.routers import DefaultRouter
from .views import EventViewSet, ParticipantViewSet, RegistrationViewSet

router = DefaultRouter()

router.register('events', EventViewSet)
router.register('participants', ParticipantViewSet)
router.register('registrations', RegistrationViewSet)

urlpatterns = router.urls