from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .recommender import MovieGraphRecommender, VectorRecommender
from rest_framework_simplejwt.authentication import JWTAuthentication
import random 

class LoadNeo4jDataView(APIView):
    def post(self, request):
        recommender = MovieGraphRecommender()
        try:
            recommender.load_data()
            return Response({'message': 'Data loaded into Neo4j successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            recommender.close()

class LoadQdrantDataView(APIView):
    def post(self, request):
        recommender = VectorRecommender()
        try:
            recommender.load_data()
            return Response({'message': 'Data loaded into Qdrant successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            recommender.close()

class Neo4jContentBasedRecommendationView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request, movie_id):
        recommender = MovieGraphRecommender()
        try:
            recommendations = recommender.recommend_movies_content_based(movie_id)
            return Response({'movie_id': movie_id, 'recommendations': recommendations}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            recommender.close()

class Neo4jFollowBasedRecommendationView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request, username):
        recommender = MovieGraphRecommender()
        try:
            genres_set = set() 
            recommendations = recommender.recommend_movies_based_on_follows(username)

            for rec in recommendations:
                genres_set.update(rec.get('genres', [])) 

            unique_genres = list(genres_set)  

            random.shuffle(recommendations)  

            return Response({
                'username': username,
                'recommendations': recommendations, 
                'genres': unique_genres
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            recommender.close()

class Neo4jUserBasedRecommendationView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request, username):
        recommender = MovieGraphRecommender()
        try:
            genres_set = set() 
            recommendations = recommender.recommend_movies_user_based(username)

            for rec in recommendations:
                genres_set.update(rec.get('genres', [])) 

            unique_genres = list(genres_set)  

            return Response({
                'username': username,
                'recommendations': recommendations, 
                'genres': unique_genres
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            recommender.close()

class QdrantContentBasedRecommendationView(APIView):
    authentication_classes = [JWTAuthentication]
    
    def get(self, request, movie_id):
        recommender = VectorRecommender()
        try:
            genres_set = set() 
            recommendations = recommender.get_movie_recommendations(movie_id)

            for rec in recommendations:
                genres_set.update(rec.get('genres', [])) 
            
            unique_genres = list(genres_set)

            return Response({
                'movie_id': movie_id,
                'recommendations': recommendations, 
                'genres': unique_genres
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            recommender.close()
