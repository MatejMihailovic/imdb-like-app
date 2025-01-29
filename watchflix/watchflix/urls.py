"""
URL configuration for watchflix project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from rest_framework import routers
from accounts.views import UserProfileViewSet
from reviews.views import ReviewViewSet
from movies.views import (
    GenreViewSet, MovieViewSet, ActorViewSet, DirectorViewSet
)
from watch_history.views import WatchHistoryViewSet
from reviews.views import ReviewViewSet

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = routers.DefaultRouter()
router.register(r'user-profiles', UserProfileViewSet)
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'genres', GenreViewSet, basename='genre')
router.register(r'movies', MovieViewSet, basename='movie')
router.register(r'actors', ActorViewSet, basename='actor')
router.register(r'directors', DirectorViewSet, basename='director')
router.register(r'watch-history', WatchHistoryViewSet, basename='watch-history')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/accounts/', include('accounts.urls')),
    path('api/recommendations/', include('recommender.urls')),
    path('api/movie/', include('movies.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
