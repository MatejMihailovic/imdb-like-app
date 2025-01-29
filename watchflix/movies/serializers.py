from rest_framework import serializers
from .models import Genre, Movie, Person, Actor, Director

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['name']

class PersonSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = ['id', 'first_name', 'last_name', 'full_name', 'birth_year']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class MovieTitleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ['id', 'title']

class ActorSerializer(PersonSerializer):
    movies = MovieTitleSerializer(many=True, read_only=True)

    class Meta(PersonSerializer.Meta):
        model = Actor
        fields = PersonSerializer.Meta.fields + ['movies']

class DirectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Director
        fields = ['id', 'first_name', 'last_name', 'birth_year']

class MovieSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        source='genres',
        write_only=True
    )
    actors = ActorSerializer(many=True, read_only=True)
    directors = DirectorSerializer(many=True, read_only=True)
    poster_url = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = Movie
        fields = '__all__'

class ShowMovieSerializer(serializers.ModelSerializer):
    genres = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name'
    )

    # This ensures the average rating is serialized as a string
    avg_rating = serializers.DecimalField(
        max_digits=3,
        decimal_places=2,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Movie
        fields = [
            'title',
            'id',
            'release_year',
            'imdb_id',
            'poster_url',
            'duration',
            'genres',
            'avg_rating'
        ]
