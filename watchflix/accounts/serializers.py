from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import UserProfile, SubscriptionPlan, Feature
from movies.serializers import ActorSerializer, DirectorSerializer

class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['description']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features = FeatureSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'price', 'features']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super(UserSerializer, self).create(validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()  
    subscription_plan = SubscriptionPlanSerializer(required=False, allow_null=True)
    followed_actors = ActorSerializer(many=True)
    followed_directors = DirectorSerializer(many=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'birth_date', 'avatar', 'created_at', 'subscription_plan', 'followed_actors', 'followed_directors']
        read_only_fields = ['created_at']


class RegisterSerializer(serializers.ModelSerializer):
    subscription_plan = serializers.PrimaryKeyRelatedField(queryset=SubscriptionPlan.objects.all(), required=True)
    birth_date = serializers.DateField(required=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'birth_date', 'subscription_plan']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        birth_date = validated_data.pop('birth_date')
        subscription_plan = validated_data.pop('subscription_plan')

        print(validated_data.pop('birth_date'))
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''), 
            last_name=validated_data.get('last_name', '')
        )

        UserProfile.objects.create(
            user=user,
            birth_date=birth_date,
            subscription_plan=subscription_plan
        )

        return user