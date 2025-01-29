from .models import UserProfile, SubscriptionPlan
from .serializers import UserProfileSerializer, SubscriptionPlanSerializer, RegisterSerializer
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from movies.models import Actor, Director
from recommender.recommender import MovieGraphRecommender

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    lookup_field = 'username'  

    def get_object(self):
        username = self.kwargs.get(self.lookup_field)  
        return get_object_or_404(UserProfile, user__username=username)

    @action(detail=True, methods=['post'], url_path='follow-actor/(?P<actor_id>\d+)')
    def follow_actor(self, request, username=None, actor_id=None):
        try:
            graph_recommender = MovieGraphRecommender()

            user_profile = self.get_object()
            actor = Actor.objects.get(id=actor_id)

            actor.followers.add(user_profile)
            actor.save()

            graph_recommender.create_follows_actor_relationship(user_profile.id, actor_id)

            return Response({'detail': f'You are now following {actor.first_name} {actor.last_name}.'}, status=status.HTTP_200_OK)
        except Actor.DoesNotExist:
            return Response({'error': 'Actor not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        finally:
            if 'graph_recommender' in locals():
                graph_recommender.close()

    @action(detail=True, methods=['post'], url_path='follow-director/(?P<director_id>\d+)')
    def follow_director(self, request, username=None, director_id=None):
        try:
            graph_recommender = MovieGraphRecommender()

            user_profile = self.get_object()
            director = Director.objects.get(id=director_id)

            director.followers.add(user_profile)
            director.save()

            graph_recommender.create_follows_director_relationship(user_profile.id, director_id)

            return Response({'detail': f'You are now following {director.first_name} {director.last_name}.'}, status=status.HTTP_200_OK)
        
        except Director.DoesNotExist:
            return Response({'error': 'Director not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        finally:
            if 'graph_recommender' in locals():
                graph_recommender.close()

    @action(detail=True, methods=['get'], url_path='is-admin')
    def is_admin(self, request, username=None):
        try:
            user_profile = self.get_object()

            return Response({'is_admin': user_profile.is_admin}, status=status.HTTP_200_OK)
        except Actor.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Authenticate the user
        user = authenticate(request, username=email, password=password)

        if user:
            # Generate tokens using Simple JWT
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'detail': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
class LogoutAPIView(APIView):

    def post(self, request):
        try:
               refresh_token = request.data["refresh_token"]
               token = RefreshToken(refresh_token)
               token.blacklist()
               return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
               return Response(status=status.HTTP_400_BAD_REQUEST)

class SubscriptionPlanView(APIView):
    def get(self, request, *args, **kwargs):
        subscription_plans = SubscriptionPlan.objects.all()
        serializer = SubscriptionPlanSerializer(subscription_plans, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RegisterView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Registration successful'}, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)