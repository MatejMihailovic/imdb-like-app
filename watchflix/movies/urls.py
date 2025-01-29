from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MovieSearchView, AddMovieByIMDBView

urlpatterns = [
    path('search/', MovieSearchView.as_view(), name='movie-search'),
    path('add/', AddMovieByIMDBView.as_view(), name='movie-add'),
]
