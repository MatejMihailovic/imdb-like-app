from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from .models import Review
from .serializers import ReviewSerializer
from movies.models import Movie
from accounts.models import UserProfile

class ReviewViewSet(viewsets.ModelViewSet):
    authentication_classes = [JWTAuthentication]
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        """Override to attach the correct user profile."""
        username = self.request.data.get('username')
        user_profile = get_object_or_404(UserProfile, user__username=username)

        serializer.save(user=user_profile)

    @action(detail=False, methods=['get'], url_path='movie/(?P<movie_id>[^/.]+)')
    def get_reviews_for_movie(self, request, movie_id=None):
        """List reviews for a specific movie."""
        movie = get_object_or_404(Movie, id=movie_id)
        reviews = Review.objects.filter(movie=movie)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='user-reviews')
    def get_user_reviews(self, request, pk=None):
        """List reviews written by a specific user."""
        user_profile = get_object_or_404(UserProfile, user__id=pk)
        reviews = Review.objects.filter(user=user_profile)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'], url_path='movie/(?P<movie_id>[^/.]+)/delete-review')
    def delete_user_review(self, request, movie_id=None):
        """Delete a review for a movie by the user."""
        username = request.data.get('username')
        user_profile = get_object_or_404(UserProfile, user__username=username)
        movie = get_object_or_404(Movie, id=movie_id)

        # Find the review for the movie by this user
        review = Review.objects.filter(movie=movie, user=user_profile).first()
        if review:
            review.delete()
            return Response({'detail': 'Review deleted successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)
