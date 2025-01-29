from django.urls import path
from .views import LoginView, LogoutAPIView, RegisterView, SubscriptionPlanView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    path('subscription-plans/', SubscriptionPlanView.as_view(), name='subscription_plans')
]