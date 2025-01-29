# import pandas as pd
# from movies.models import Movie, Actor, Director, Genre
# from django.db import transaction
# from omdb import fetch_movie_details
# from datetime import datetime, timedelta
# import random
# import logging

# logger = logging.getLogger(__name__)

# def create_person_instances(names, model):
#     instances = []
#     for name in names:
#         name_parts = name.split(' ', maxsplit=1)
#         first_name = name_parts[0]
#         last_name = name_parts[len(name_parts) - 1] if len(name_parts) > 1 else ''
#         birth_date = datetime.today() - timedelta(days=random.randint(30 * 365, 65 * 365))
        
#         instance, _ = model.objects.get_or_create(
#             first_name=first_name,
#             last_name=last_name,
#             defaults={'birth_year': birth_date.year}
#         )
#         instances.append(instance)
#     return instances

# def load_actors_and_directors(movie, movie_data, graph_recommender):
#     if not movie_data:
#         logger.warning(f"Skipping movie with ID {movie.imdb_id} due to missing data.")
#         return None

#     actors_data = movie_data.get('actors')
#     if actors_data:
#         actor_names = actors_data.split(', ')
#         actor_instances = create_person_instances(actor_names, Actor)
#         movie.actors.set(actor_instances)
#     else:
#         logger.warning(f"Missing actor data for movie with ID {movie.imdb_id}.")

#     for actor in actor_instances:
#         graph_recommender.create_actor(actor.id, actor.first_name, actor.last_name, actor.birth_year)
#         graph_recommender.create_acts_relationship(actor.id, movie.id)

#     director_data = movie_data.get('director')
#     if director_data:
#         director_names = director_data.split(', ')
#         director_instances = create_person_instances(director_names, Director)
#         movie.directors.set(director_instances)
#     else:
#         logger.warning(f"Missing director data for movie with ID {movie.imdb_id}.")

#     for director in director_instances:
#         graph_recommender.create_director(director.id, director.first_name, director.last_name, director.birth_year)
#         graph_recommender.create_directs_relationship(director.id, movie.id)

#     return movie

# def load_movies(imdb_id):
#         movie_data = fetch_movie_details(imdb_id)
#         if movie_data:
#             create_or_update_movie(movie_data)
#         else:
#             logger.warning(f"Skipping movie with ID {imdb_id} due to missing data.")

# @transaction.atomic
# def create_or_update_movie(movie_data, graph_recommender):
#     genres_list = movie_data['Genre'].split('|')
#     genre_instances = []

#     for genre_name in genres_list:
#         genre, _ = Genre.objects.get_or_create(name=genre_name)
#         genre_instances.append(genre)

#     movie, created = Movie.objects.get_or_create(
#         imdb_id=movie_data['movieId'],
#         defaults={
#             'title': movie_data.get('title'),
#             'synopsis': row.get('plot_synopsis', ''),
#             'release_year': row.get('year', 0),
#             'duration': movie_data.get('duration', 0),  
#             'imdb_id': row.get('imdbId', ''),
#             'poster_url': movie_data.get('poster_url', '')  
#         }
#     )

#     if not created:  
#         movie.title = row.get('title')
#         movie.synopsis = row.get('plot_synopsis', '')
#         movie.release_year = row.get('year', 0)
#         movie.duration = movie_data.get('duration', 0)
#         movie.poster_url = movie_data.get('poster_url', '')
#         movie.save()

#     graph_recommender.create_movie(
#         movie.id, movie.title, movie.release_year, movie.synopsis, movie.duration, movie.poster_url,
#         [genre.name for genre in genre_instances]
#     )
    
#     movie = load_actors_and_directors(movie, movie_data, graph_recommender)

#     if movie:
#         movie.genres.set(genre_instances)
#         movie.save()
    
#     print('Movie created')
