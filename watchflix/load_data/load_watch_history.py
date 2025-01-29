from watch_history.models import WatchHistory
from accounts.models import UserProfile
from movies.models import Movie
from django.db import transaction
from django.db.models import Avg
from datetime import datetime
from recommender.recommender import MovieGraphRecommender

graph_recommender = MovieGraphRecommender()

def load_watch_history(ratings_filtered):
    print("Starting load_watch_history...")  

    # Fetch and map users
    user_ids = [f'user_{user_id}' for user_id in ratings_filtered['userId'].unique()]
    print(f"User IDs to fetch: {user_ids}")

    user_map = {
        user.user.username: user
        for user in UserProfile.objects.filter(user__username__in=user_ids)
    }
    print(f"Fetched {len(user_map)} users.")

    movie_ids = ratings_filtered['movieId'].unique()
    print(f"Movie IDs to fetch: {movie_ids}")

    movie_map = {
        movie.id: movie
        for movie in Movie.objects.filter(id__in=movie_ids)
    }
    print(f"Fetched {len(movie_map)} movies.")

    watch_history_objects = []
    for idx, row in ratings_filtered.iterrows():
        username = f'user_{int(row["userId"])}'
        user = user_map.get(username)
        movie = movie_map.get(row['movieId'])

        if user and movie:
            print(f"Processing user: {username}, movie: {movie.id}")

            if not WatchHistory.objects.filter(user=user, movie=movie).exists():
                print(f"Adding to watch history: {user.user.username} -> {movie.id}")
                watch_history_objects.append(
                    WatchHistory(
                        user=user,
                        movie=movie,
                        timestamp=datetime.fromtimestamp(row['timestamp']),
                        rating=row['rating']
                    )
                )

                # Debug print for relationship creation in Neo4j
                print(f"Creating graph relationship for user: {user.id}, movie: {movie.id}, rating: {row['rating']}")
                graph_recommender.create_relationship(user.id, movie.id, row['rating'])

    if watch_history_objects:
        print(f"Bulk inserting {len(watch_history_objects)} watch history records...")
        with transaction.atomic():
            WatchHistory.objects.bulk_create(watch_history_objects, batch_size=1000)

    update_movie_avg_ratings(movie_map)

    print("Finished load_watch_history.")  

def update_movie_avg_ratings(movie_map):
    print("Updating movie average ratings...")
    for movie_id in movie_map.keys():
        avg_rating = WatchHistory.objects.filter(movie__id=movie_id).aggregate(average_rating=Avg('rating'))['average_rating']
        
        if avg_rating is not None:
            movie = movie_map[movie_id]
            movie.avg_rating = avg_rating
            movie.save()
            print(f"Updated movie {movie.id} with new average rating: {avg_rating}")

    print("Finished updating movie average ratings.")

graph_recommender.close()
