from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Count
from accounts.models import UserProfile
from movies.models import Movie
from .models import WatchHistory
from .serializers import WatchHistorySerializer, CreateWatchHistorySerializer
from rest_framework_simplejwt.authentication import JWTAuthentication

class WatchHistoryViewSet(viewsets.ViewSet):
    authentication_classes = [JWTAuthentication]

    @action(detail=False, methods=['get'], url_path='user/(?P<username>[^/.]+)')
    def list_user_watched_movies(self, request, username=None):
        """
        List all movies a specific user has watched with their ratings and popularity.
        Access via: /api/watch-history/user/<username>/
        """
        user_profile = get_object_or_404(UserProfile, user__username=username)
        queryset = WatchHistory.objects.filter(user=user_profile)\
            .select_related('movie')\
            .annotate(popularity=Count('movie__watchhistory'))\
            .order_by('-timestamp')
        
        serializer = WatchHistorySerializer(queryset, many=True)
        genres_set = set()
        user_watched_movies = serializer.data

        for movie in user_watched_movies:
            movie_data = movie.get('movie')
            genres_set.update(movie_data.get('genres'))

        unique_genres = list(genres_set)

        return Response({
                'username': username,
                'user_watched_movies': user_watched_movies, 
                'genres': unique_genres
            }, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """Add or update a movie to the user's watch history with an optional rating."""
        movie_id = request.data.get('movie')
        username = request.data.get('username')
        rating = request.data.get('rating', None)

        user_profile = get_object_or_404(UserProfile, user__username=username)
        movie = get_object_or_404(Movie, id=movie_id)

        watch_history = WatchHistory.objects.filter(user=user_profile, movie=movie).first()

        if watch_history:
            watch_history.rating = rating
            watch_history.save()
            return Response({'detail': 'Watch history updated', 'rating': rating}, status=status.HTTP_200_OK)

        # Save new watch history entry
        serializer = CreateWatchHistorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user_profile, movie=movie)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='check-watched/(?P<movie_id>[^/.]+)')
    def check_watched(self, request, movie_id=None, *args, **kwargs):
        """
        Check if a user has watched a specific movie.
        Access via: /api/watch-history/check-watched/<movie_id>/?user=<username>
        """
        username = request.GET.get('user')

        user_profile = get_object_or_404(UserProfile, user__username=username)
        movie = get_object_or_404(Movie, id=movie_id)

        watch_history = WatchHistory.objects.filter(user=user_profile, movie=movie).first()

        if watch_history:
            return Response({
                'watched': True,
                'rating': watch_history.rating
            }, status=status.HTTP_200_OK)

        return Response({'watched': False}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='get-popularity/(?P<movie_id>[^/.]+)')
    def get_popularity(self, request, movie_id=None, *args, **kwargs):
        """
        Get popularity of a movie
        """
        popularity = WatchHistory.objects.filter(movie__id=movie_id).count()

        if popularity > 0:
            return Response({
                'movie_id': movie_id,
                'popularity': popularity,
                'detail': f'This movie has been watched by {popularity} user(s).'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'movie_id': movie_id,
                'popularity': popularity,
                'detail': 'This movie has not been watched by any user yet.'
            }, status=status.HTTP_200_OK)

        
