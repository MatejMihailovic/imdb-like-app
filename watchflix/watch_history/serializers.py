from rest_framework import serializers
from .models import WatchHistory
from movies.serializers import ShowMovieSerializer
from movies.models import Movie 

class WatchHistorySerializer(serializers.ModelSerializer):
    movie = ShowMovieSerializer(read_only=True)
    rating = serializers.FloatField() 
    timestamp = serializers.DateTimeField()

    class Meta:
        model = WatchHistory
        fields = ['movie', 'rating', 'timestamp']

class CreateWatchHistorySerializer(serializers.ModelSerializer):
    movie = serializers.PrimaryKeyRelatedField(queryset=Movie.objects.all())

    class Meta:
        model = WatchHistory
        fields = ['movie', 'timestamp', 'rating', 'user']
        read_only_fields = ['user', 'timestamp']

    def create(self, validated_data):
        return WatchHistory.objects.create(**validated_data)