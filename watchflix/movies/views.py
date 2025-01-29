from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Genre, Movie, Actor, Director
from accounts.models import UserProfile
from .serializers import (
    GenreSerializer, MovieSerializer, ShowMovieSerializer,
    ActorSerializer, DirectorSerializer
)
from recommender.recommender import VectorRecommender, MovieGraphRecommender
from datetime import datetime, timedelta
import random
import requests

# Genre ViewSet
class GenreViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer

class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

class AddMovieByIMDBView(APIView):
    
    def post(self, request):
        imdb_url = request.data.get('imdb_url')

        if not imdb_url:
            return Response({'error': 'IMDb URL is required.'}, status=status.HTTP_400_BAD_REQUEST)

        graph_recommender = MovieGraphRecommender()
        vector_recommender = VectorRecommender()
        api_url = 'http://www.omdbapi.com/'
        api_key = 'a475ded9'

        try:
            imdb_id = self.extract_imdb_id(imdb_url)
            movie_data = self.fetch_movie_data(api_url, api_key, imdb_id)

            # Create or get the movie instance
            movie, created = Movie.objects.get_or_create(
                imdb_id=imdb_id,
                defaults={
                    'title': movie_data['Title'],
                    'release_year': int(movie_data.get('Year')),
                    'duration': self.parse_runtime(movie_data.get('Runtime', '0')),
                    'synopsis': movie_data['Plot'],
                    'poster_url': movie_data['Poster']
                }
            )

            movie.save()

            movie = Movie.objects.get(imdb_id=imdb_id)

            genres_list = movie_data['Genre'].split(', ')
            genre_instances = []
            for genre_name in genres_list:
                genre, created = Genre.objects.get_or_create(name=genre_name.strip())
                genre_instances.append(genre)

            movie.genres.set(genre_instances)

            graph_recommender.create_movie(
                movie.id, movie.title, movie.release_year,
                movie.synopsis, movie.duration, movie.poster_url, genres_list
            )                        

            message = f"Movie '{movie.title}' was successfully added." if created else f"Movie '{movie.title}' already exists in the database."

            movie = self.load_actors_and_directors(movie, movie_data, graph_recommender)                   
            movie.save()
            
            doc = self.prepare_vector_doc(movie)
            vector_recommender.add_vector('movies', movie.id, doc)

            return Response({
                'success': True,
                'message': message,
                'movie': self.serialize_movie(movie)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        finally:
            graph_recommender.close()
            vector_recommender.close()

    # Utility methods

    def extract_imdb_id(self, imdb_url):
        try:
            return imdb_url.split('/')[-2]
        except IndexError:
            raise ValueError("Invalid IMDb URL.")

    def fetch_movie_data(self, api_url, api_key, imdb_id):
        params = {'i': imdb_id, 'apikey': api_key}
        response = requests.get(api_url, params=params)
        movie_data = response.json()

        if movie_data['Response'] != 'True':
            raise ValueError(f"OMDb API error: {movie_data.get('Error')}")
        return movie_data

    def parse_runtime(self, runtime_str):
        try:
            return int(runtime_str.split(' ')[0])
        except (ValueError, IndexError):
            return 0

    def prepare_vector_doc(self, movie):
        return {
            'title': movie.title,
            'plot': movie.synopsis,
            'id': movie.id,
            'release_year': movie.release_year,
            'imdbId': movie.imdb_id,
            'poster_url': movie.poster_url,
            'duration': movie.duration,
            'genres': [genre.name for genre in movie.genres.all()],
            'avg_rating': movie.avg_rating
        }

    def serialize_movie(self, movie):
        return {
            'title': movie.title,
            'release_year': movie.release_year,
            'imdb_id': movie.imdb_id,
            'duration': movie.duration,
            'poster_url': movie.poster_url,
            'genres': [genre.name for genre in movie.genres.all()],
        }

    @staticmethod
    def load_actors_and_directors(movie, movie_data, graph_recommender):
        """
        Load actors and directors, ensuring they're properly linked to the movie in both the Django and Neo4j models.
        """
        # Load actors
        actors_data = movie_data.get('Actors', '')
        if actors_data:
            actor_instances = AddMovieByIMDBView.create_person_instances(actors_data.split(', '), Actor)
            movie.actors.set(actor_instances)  
            # Create actor relationships in graph db
            for actor in actor_instances:
                graph_recommender.create_actor(actor.id, actor.first_name, actor.last_name, actor.birth_year)
                graph_recommender.create_acts_relationship(actor.id, movie.id)

        # Load directors
        directors_data = movie_data.get('Director', '')
        if directors_data:
            director_instances = AddMovieByIMDBView.create_person_instances(directors_data.split(', '), Director)
            movie.directors.set(director_instances)  # Use .add() to append directors without replacing existing ones
            # Create director relationships in graph db
            for director in director_instances:
                graph_recommender.create_director(director.id, director.first_name, director.last_name, director.birth_year)
                graph_recommender.create_directs_relationship(director.id, movie.id)

        return movie

    @staticmethod
    def create_person_instances(names, model):
        instances = []
        for name in names:
            first_name, last_name = AddMovieByIMDBView.split_name(name)
            birth_date = datetime.today() - timedelta(days=random.randint(18 * 365, 65 * 365))
            instance, _ = model.objects.get_or_create(first_name=first_name, last_name=last_name, birth_year=birth_date.year)
            instances.append(instance)
        return instances

    @staticmethod
    def split_name(name):
        """Helper to split name into first name and last name."""
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        return first_name, last_name
        
class ActorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Actor.objects.all()
    serializer_class = ActorSerializer

    @action(detail=True, methods=['get'], url_path='movies')
    def movies_by_actor(self, request, pk=None):
        actor = self.get_object()  
        movies = actor.movies.all()  
        if not movies.exists():
            return Response({"detail": "No movies found for this actor."}, status=status.HTTP_404_NOT_FOUND)

        genres_set = set() 
        for movie in movies:
            for genre in movie.genres.all():
                genres_set.add(genre.name)  
        
        unique_genres = list(genres_set)  

        serializer = ShowMovieSerializer(movies, many=True)
        
        return Response({
            'movies': serializer.data, 
            'genres': unique_genres  
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='is-following/(?P<username>[^/.]+)')
    def is_following(self, request, pk=None, username=None):
        try:
            user_profile = UserProfile.objects.get(user__username=username)
            is_following = user_profile.followed_actors.filter(id=pk).exists()
            return Response({'is_following': is_following}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        except Actor.DoesNotExist:
            return Response({'error': 'Actor not found'}, status=status.HTTP_404_NOT_FOUND)

class DirectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Director.objects.all()
    serializer_class = DirectorSerializer

    @action(detail=True, methods=['get'], url_path='movies')
    def movies_by_director(self, request, pk=None):
        director = self.get_object()  
        movies = director.movies.all()  
        
        if not movies.exists():
            return Response({"detail": "No movies found for this director."}, status=status.HTTP_404_NOT_FOUND)
        
        genres_set = set() 
        for movie in movies:
            for genre in movie.genres.all():
                genres_set.add(genre.name)  
        
        unique_genres = list(genres_set)  

        serializer = ShowMovieSerializer(movies, many=True)
        
        return Response({
            'movies': serializer.data, 
            'genres': unique_genres  
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='is-following/(?P<username>[^/.]+)')
    def is_following(self, request, pk=None, username=None):
        try:
            user_profile = UserProfile.objects.get(user__username=username)
            is_following = user_profile.followed_directors.filter(id=pk).exists()
            return Response({'is_following': is_following}, status=status.HTTP_200_OK)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
        except Director.DoesNotExist:
            return Response({'error': 'Director not found'}, status=status.HTTP_404_NOT_FOUND)

class MovieSearchView(APIView):
    def get(self, request):
        query = request.GET.get('query')
        search_by = request.GET.get('searchBy', 'title')  
        vector_recommender = VectorRecommender()  
        movies = []

        if not query:
            return Response({"error": "Query is required."}, status=status.HTTP_400_BAD_REQUEST)

        if search_by == 'title':
            # Search for movies by title in the database
            movies = Movie.objects.filter(title__icontains=query)
            serialized_movies = MovieSerializer(movies, many=True).data
            return Response(serialized_movies, status=status.HTTP_200_OK)

        elif search_by == 'plot':
            # Search for movies by plot using vector recommender
            movies = vector_recommender.get_movies_by_plot(query)
            return Response(movies, status=status.HTTP_200_OK)

        else:
            return Response({"error": "Invalid search type."}, status=status.HTTP_400_BAD_REQUEST)
