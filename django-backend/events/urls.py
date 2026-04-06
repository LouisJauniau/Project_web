from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    EventViewSet,
    LoginView,
    LogoutView,
    MeView,
    ParticipantViewSet,
    RegistrationViewSet,
    SignupView,
    UserDeleteView,
    UserListView,
    UserPromoteView,
)


router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'participants', ParticipantViewSet, basename='participant')
router.register(r'registrations', RegistrationViewSet, basename='registration')

urlpatterns = [
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/me/', MeView.as_view()),
    path('auth/signup/', SignupView.as_view()),
    path('auth/users/', UserListView.as_view()),
    path('auth/users/<int:user_id>/promote/', UserPromoteView.as_view()),
    path('auth/users/<int:user_id>/', UserDeleteView.as_view()),
]

urlpatterns += router.urls
