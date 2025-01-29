import pandas as pd
import os
import django
import sys

# Add project path to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'watchflix.settings')

# Setup Django
django.setup()

# Import functions and models
from load_data.load_movies import load_movies
from load_data.load_users import create_user_profiles
from load_data.load_watch_history import load_watch_history
from load_data.preprocess_data import process_ratings
from movies.models import Movie
from watch_history.models import WatchHistory
from accounts.models import UserProfile

# Load CSV files
print("Loading movie and rating data...")
movies = pd.read_csv('../data/movies.csv', sep=',')
ratings = pd.read_csv('../data/ratings.csv', sep=',', nrows=1000000)
links = pd.read_csv('../data/links.csv', sep=',')
movies_with_plots = pd.read_csv('../data/mpst_full_data.csv', sep=',')

# Process and merge ratings and movie data
print("Processing and merging movie data...")
ratings_filtered, movies_merged = process_ratings(movies, movies_with_plots, ratings, links)

# Check for existing movies
print("Filtering out existing movies...")
existing_movies_ids = set(Movie.objects.values_list('id', flat=True))  
filtered_movies_merged = movies_merged[~movies_merged['movieId'].isin(existing_movies_ids)]
print(f"{len(filtered_movies_merged)} new movies to load.")
#load_movies(filtered_movies_merged)


existing_user_ids = set(UserProfile.objects.values_list('id', flat=True))
create_user_profiles(ratings_filtered[~ratings_filtered['userId'].isin(existing_user_ids)])

# Check existing watch history
print("Checking existing watch history...")
existing_watch_history = set(
    WatchHistory.objects.values_list('user_id', 'movie_id')
)

# Filter ratings for new watch history entries
ratings_filtered['user_movie_tuple'] = list(zip(ratings_filtered['userId'], ratings_filtered['movieId']))
filtered_ratings_filtered = ratings_filtered[
    ~ratings_filtered['user_movie_tuple'].isin(existing_watch_history)
]
print(f"{len(filtered_ratings_filtered)} new watch history entries to load.")

# Load watch history
load_watch_history(filtered_ratings_filtered)

# Clean up ratings dataframe
ratings_filtered.drop('user_movie_tuple', axis=1, inplace=True)
