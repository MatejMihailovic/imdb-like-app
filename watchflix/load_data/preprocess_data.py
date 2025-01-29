import pandas as pd

def process_ratings(movies, movies_with_plots, ratings, links):
    movies_with_plots.rename(columns={"imdb_id": "imdbId"}, inplace=True)

    user_ids = ratings['userId'].unique()
    user2idx = {user_id: i for i, user_id in enumerate(user_ids)}
    movie_ids = ratings['movieId'].unique()
    movie2idx = {movie_id: i for i, movie_id in enumerate(movie_ids)}

    ratings['userId'] = ratings['userId'].map(user2idx)
    ratings['movieId'] = ratings['movieId'].map(movie2idx)

    # Filter movies with at least 10 votes
    movie_counts = ratings.groupby('movieId')['userId'].count()
    popular_movies = movie_counts[movie_counts >= 10].index
    ratings_filtered = ratings[ratings['movieId'].isin(popular_movies)].copy()

    # Filter users who have rated at least 50 movies
    user_counts = ratings_filtered.groupby('userId')['movieId'].count()
    active_users = user_counts[user_counts >= 50].index
    ratings_filtered = ratings_filtered[ratings_filtered['userId'].isin(active_users)].copy()

    movies_filtered = movies[movies['movieId'].isin(popular_movies)].copy()
    links_filtered = links[links['movieId'].isin(popular_movies)].copy()

    # Ensure 'imdbId' follows the correct formatting (prefix with 'tt' and zero-padding to 7 digits)
    links_filtered['imdbId'] = 'tt' + links_filtered['imdbId'].astype(str).str.zfill(7)

    movies_merged = pd.merge(links_filtered, movies_with_plots, on='imdbId', how='left')

    movies_merged.drop(columns=['split', 'synopsis_source', 'tmdbId'], inplace=True)

    # Extract year from the title in movies_filtered and append to movies_merged
    movies_filtered['year'] = movies_filtered['title'].str.extract(r'\((\d{4})\)')

    movies_merged = pd.merge(movies_merged, movies_filtered[['movieId', 'year', 'genres']], on='movieId', how='left')

    movies_merged.dropna(inplace=True)

    # Filter ratings based on available movies in the merged DataFrame
    ratings_filtered = ratings_filtered[ratings_filtered['movieId'].isin(movies_merged['movieId'])].copy()

    movies_merged.to_csv('../data/movies_filtered.csv')
    ratings_filtered.to_csv('../data/ratings_filtered.csv')
    
    return ratings_filtered, movies_merged