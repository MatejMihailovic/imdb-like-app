import random
import names
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from accounts.models import UserProfile, SubscriptionPlan, Feature
from recommender.recommender import MovieGraphRecommender

graph_recommender = MovieGraphRecommender()

def create_subscription_plans():
    basic_plan, _ = SubscriptionPlan.objects.get_or_create(
        name='Basic Plan', defaults={'price': 9.99})
    premium_plan, _ = SubscriptionPlan.objects.get_or_create(
        name='Premium Plan', defaults={'price': 19.99})

    basic_features = ['Access to standard content', 'Stream on one device', 'Standard quality']
    premium_features = ['HD and Ultra HD', 'Stream on 4 devices', 'Offline downloads']

    for feature in basic_features:
        Feature.objects.get_or_create(description=feature, subscription_plan=basic_plan)

    for feature in basic_features + premium_features:
        Feature.objects.get_or_create(description=feature, subscription_plan=premium_plan)

def create_user_profiles(user_ids):
    print(f"Creating user profiles for user IDs: {user_ids}...")

    for user_id in user_ids:
        username = f'user_{user_id}'
        password = 'password123'
        first_name = names.get_first_name()
        last_name = names.get_last_name()

        if not User.objects.filter(username=username).exists():
            print(f'Creating user with username: {username}, first name: {first_name}, last name: {last_name}.')

            user = User.objects.create_user(
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            birth_date = datetime.today() - timedelta(days=random.randint(18 * 365, 65 * 365))

            # Assign Premium Plan for odd user IDs and Basic Plan for even user IDs
            subscription_plan = SubscriptionPlan.objects.get(name='Premium Plan') if user_id % 2 else SubscriptionPlan.objects.get(name='Basic Plan')
            print(f'Assigned subscription plan: {subscription_plan.name}')

            # Create the UserProfile and save the user details
            user_profile = UserProfile.objects.create(
                user=user,
                birth_date=birth_date.date(),
                subscription_plan=subscription_plan
            )
            print(f'UserProfile created for user {username} with subscription plan {subscription_plan.name}')

            # Create the user in the graph-based recommender system
            graph_recommender.create_user(user_profile.id, user.username, str(user_profile.birth_date))
            print(f'User {username} added to graph-based recommender system.')
        else:
            print(f'User with username {username} already exists. Skipping creation.')

    print("Finished creating user profiles.")
