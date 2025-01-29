from rest_framework import serializers
from .models import Review
from movies.models import Movie 
from accounts.models import UserProfile 
from accounts.serializers import UserProfileSerializer

class ReviewSerializer(serializers.ModelSerializer):
    movie = serializers.PrimaryKeyRelatedField(queryset=Movie.objects.all())
    user = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'movie', 'text', 'date']
        read_only_fields = ['user', 'date']  
