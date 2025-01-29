import os
import django
from neo4j import GraphDatabase
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer
import numpy as np
from movies.models import Movie
from accounts.models import UserProfile
from watch_history.models import WatchHistory
import logging
from django.core.cache import cache

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'watchflix.settings') 
django.setup()

from django.conf import settings

class MovieGraphRecommender:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            settings.NEO4J_URI, auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
        )

    def close(self):
        self.driver.close()

    def _execute_write(self, func, *args, **kwargs):
        with self.driver.session() as session:
            session.write_transaction(func, *args, **kwargs)

    def _execute_read(self, func, *args, **kwargs):
        with self.driver.session() as session:
            return session.read_transaction(func, *args, **kwargs)

    @staticmethod
    def _run_query(tx, query, **params):
        result = tx.run(query, **params)
        return result.data()

    def create_user(self, user_id, username, date_of_birth):
        query = """
        CREATE (u:User {id: $user_id, username: $username, date_of_birth: $date_of_birth})
        """
        self._execute_write(self._run_query, query, user_id=user_id, username=username, date_of_birth=date_of_birth)

    def create_movie(self, movie_id, title, release_year, synopsis, duration, poster_url, genres):
        movie_query = """
        MERGE (m:Movie {id: $movie_id, title: $title, release_year: $release_year, 
        synopsis: $synopsis, duration: $duration, poster_url: $poster_url})
        """
        self._execute_write(self._run_query, movie_query, movie_id=movie_id, title=title, release_year=release_year, 
                            synopsis=synopsis, duration=duration, poster_url=poster_url)
        self._create_genres(movie_id, genres)

    def _create_genres(self, movie_id, genres):
        genre_query = """
        MERGE (g:Genre {name: $genre_name})
        WITH g
        MATCH (m:Movie {id: $movie_id})
        MERGE (m)-[:BELONGS]->(g)
        """
        for genre in genres:
            self._execute_write(self._run_query, genre_query, genre_name=genre, movie_id=movie_id)

    def create_actor(self, actor_id, first_name, last_name, birth_year):
        query = """
        MERGE (a:Actor {id: $actor_id})
        ON CREATE SET a.first_name = $first_name, a.last_name = $last_name, a.birth_year = $birth_year
        """
        self._execute_write(self._run_query, query, actor_id=actor_id, first_name=first_name, last_name=last_name, birth_year=birth_year)

    def create_director(self, director_id, first_name, last_name, birth_year):
        query = """
        MERGE (d:Director {id: $director_id})
        ON CREATE SET d.first_name = $first_name, d.last_name = $last_name, d.birth_year = $birth_year
        """
        self._execute_write(self._run_query, query, director_id=director_id, first_name=first_name, last_name=last_name, birth_year=birth_year)

    def create_acts_relationship(self, actor_id, movie_id):
        query = """
        MATCH (a:Actor {id: $actor_id}), (m:Movie {id: $movie_id})
        MERGE (a)-[:ACTS]->(m)
        """
        self._execute_write(self._run_query, query, actor_id=actor_id, movie_id=movie_id)

    def create_directs_relationship(self, director_id, movie_id):
        query = """
        MATCH (d:Director {id: $director_id}), (m:Movie {id: $movie_id})
        MERGE (d)-[:DIRECTS]->(m)
        """
        self._execute_write(self._run_query, query, director_id=director_id, movie_id=movie_id)

    def create_relationship(self, user_id, movie_id, rating):
        query = """
        MATCH (u:User {id: $user_id}), (m:Movie {id: $movie_id})
        MERGE (u)-[:WATCHED {rating: $rating}]->(m)
        """
        self._execute_write(self._run_query, query, user_id=user_id, movie_id=movie_id, rating=float(rating))

    def create_relationships_batch(self, relationships):
        query = """
        UNWIND $relationships AS rel
        MATCH (u:User {id: rel[0]}), (m:Movie {id: rel[1]})
        CREATE (u)-[:WATCHED {rating: rel[2]}]->(m)
        """
        self._execute_write(self._run_query, query, relationships=relationships)

    def recommend_movies_user_based(self, username, limit=100):
        cache_key = f"user_recommendations_{username}"
        recommendations = cache.get(cache_key)

        if not recommendations:
            query = """
            MATCH (u:User {username: $username})-[:WATCHED]->(m:Movie)<-[:WATCHED]-(other:User)-[r:WATCHED]->(rec:Movie)
            WHERE NOT (u)-[:WATCHED]->(rec)
            WITH rec, COUNT(r) AS popularity, AVG(r.rating) AS avg_rating
            MATCH (rec)-[:BELONGS]->(g:Genre)
            WITH rec, popularity, avg_rating, COLLECT(g.name) AS genres
            RETURN rec.id AS id, rec.title AS title, rec.duration AS duration, 
                rec.poster_url AS poster_url, rec.release_year AS release_year, 
                rec.synopsis AS synopsis, genres, popularity, avg_rating
            ORDER BY avg_rating DESC, popularity DESC
            LIMIT $limit
            """
            recommendations = self._execute_read(self._run_query, query, username=username, limit=limit)
            # Cache the recommendations for 10 minutes
            cache.set(cache_key, recommendations, timeout=600)

        return recommendations

    def recommend_movies_based_on_follows(self, username, limit=50):
        query = """
        MATCH (u:User {username: $username})-[:FOLLOWS]->(p)
        OPTIONAL MATCH (p)-[:ACTS]->(m:Movie)
        OPTIONAL MATCH (p)-[:DIRECTS]->(m:Movie)
        WHERE NOT (u)-[:WATCHED]->(m)
        WITH m
        OPTIONAL MATCH (m)<-[r:WATCHED]-(otherUsers:User)
        WITH m, COALESCE(AVG(r.rating), 0) AS avg_rating
        OPTIONAL MATCH (m)-[:BELONGS]->(g:Genre)
        WITH m, avg_rating, COLLECT(g.name) AS genres
        RETURN DISTINCT m.id AS id, m.title AS title, m.poster_url AS poster_url, 
            m.release_year AS release_year, avg_rating, genres
        LIMIT $limit
        """
        return self._execute_read(self._run_query, query, username=username, limit=limit)

    def recommend_movies_content_based(self, movie_id, limit=20):
        query = """
        MATCH (m:Movie {id: $movie_id})-[:BELONGS]->(g:Genre)<-[:BELONGS]-(rec:Movie)
        WHERE rec.id <> $movie_id
        RETURN rec.id AS id, rec.title AS title, rec.duration AS duration, 
        rec.poster_url AS poster_url, rec.release_year AS release_year, 
        rec.synopsis AS synopsis
        LIMIT $limit
        """
        return self._execute_read(self._run_query, query, movie_id=movie_id, limit=limit)

    def delete_all(self):
        query = "MATCH (n) DETACH DELETE n"
        self._execute_write(self._run_query, query)

    def create_follows_actor_relationship(self, user_id, actor_id):
        query = """
        MATCH (u:User {id: $user_id}), (a:Actor {id: $actor_id})
        CREATE (u)-[:FOLLOWS]->(a)
        """
        self._execute_write(self._run_query, query, user_id=user_id, actor_id=actor_id)

    def create_follows_director_relationship(self, user_id, director_id):
        query = """
        MATCH (u:User {id: $user_id}), (d:Director {id: $director_id})
        CREATE (u)-[:FOLLOWS]->(d)
        """
        self._execute_write(self._run_query, query, user_id=user_id, director_id=director_id)

    def load_data(self):
        self.delete_all()
        self._load_movies()
        self._load_users()
        self._load_watch_relationships()

    def _load_movies(self):
        movies = Movie.objects.all()
        for movie in movies:
            self.create_movie(
                movie_id=movie.id, title=movie.title, release_year=movie.release_year,
                synopsis=movie.synopsis, duration=movie.duration, poster_url=movie.poster_url,
                genres=[genre.name for genre in movie.genres.all()]
            )
            self._load_actors_directors(movie)

    def _load_actors_directors(self, movie):
        for actor in movie.actors.all():
            self.create_actor(actor.id, actor.first_name, actor.last_name, actor.birth_year)
            self.create_acts_relationship(actor.id, movie.id)

        for director in movie.directors.all():
            self.create_director(director.id, director.first_name, director.last_name, director.birth_year)
            self.create_directs_relationship(director.id, movie.id)

    def _load_users(self):
        user_profiles = UserProfile.objects.select_related('user').all()
        for user_profile in user_profiles:
            self.create_user(user_profile.user.id, user_profile.user.username, user_profile.birth_date)

    def _load_watch_relationships(self):
        watch_records = WatchHistory.objects.all()
        relationships = [(record.user.id, record.movie.id, float(record.rating) or 0) for record in watch_records]

        batch_size = 10000
        for i in range(0, len(relationships), batch_size):
            self.create_relationships_batch(relationships[i:i + batch_size])


class VectorRecommender:
    def __init__(self):
        qdrant_uri = settings.QDRANT_URI
        encoder_name = settings.ENCODER_MODEL_NAME
        self.client = QdrantClient(url=qdrant_uri)
        self.encoder = SentenceTransformer(encoder_name, device="cpu")
        self.logger = logging.getLogger(__name__)  

    def create_collection(self, collection_name):
        try:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=self.encoder.get_sentence_embedding_dimension(), 
                    distance=models.Distance.COSINE,
                    on_disk=True
                    ),  
                quantization_config=models.ScalarQuantization(
                scalar=models.ScalarQuantizationConfig(
                    type=models.ScalarType.INT8,
                    always_ram=True,
                    ),
                ),                          
            )

            self.logger.info(f"Collection '{collection_name}' created successfully.")
        except Exception as e:
            self.logger.error(f"Error creating collection: {e}")
    
    def get_embeddings(self, text):
        if not text:
            return np.zeros(self.encoder.get_sentence_embedding_dimension())

        return self.encoder.encode(text, show_progress_bar=True).tolist()
    
    def add_vector(self, collection_name, doc_id, doc):
        try:
            self.logger.info(f"Adding vector for document ID {doc_id} to the '{collection_name}' collection.")

            vector = self.get_embeddings(doc['plot'])

            payload = {k: v for k, v in doc.items() if k != 'plot'}
            
            point = models.PointStruct(
                id=doc_id,
                vector=vector,
                payload=payload
            )
            
            self.client.upload_points(collection_name=collection_name, points=[point])

            self.logger.info(f"Uploaded vector for document ID {doc_id} successfully.")
        except Exception as e:
            self.logger.error(f"Error adding vector for document ID {doc_id}: {e}")

    def add_vectors(self, collection_name, ids, docs):
        try:
            if len(ids) != len(docs):
                raise ValueError("Length of ids and docs must be equal.")

            self.logger.info(f"Adding {len(ids)} vectors to the '{collection_name}' collection.")

            points = [
                models.PointStruct(
                    id=id_, 
                    vector=self.get_embeddings(doc['plot']), 
                    payload={k: v for k, v in doc.items() if k != 'plot'},  
                )
                for id_, doc in zip(ids, docs)
            ]

            self.client.upload_points(collection_name=collection_name, points=points)
            self.logger.info(f"Uploaded {len(points)} vectors successfully.")
        except Exception as e:
            self.logger.error(f"Error adding vectors: {e}")
    
    def save_collection(self, collection_name, path):
        self.client.export_collection(collection_name, path)

    def load_collection(self, collection_name, path):
        self.client.import_collection(collection_name, path)

    def _add_movie_vectors(self):
        try:
            movies = Movie.objects.all()
            if not movies.exists():
                self.logger.warning("No movies found in the database.")
                return

            ids = []
            docs = []
            for movie in movies:
                ids.append(movie.id)
                genre_names = [genre.name for genre in movie.genres.all()]
                print(genre_names)
                docs.append({
                    'title': movie.title,
                    'plot': movie.synopsis,
                    'id': movie.id,
                    'release_year': movie.release_year,
                    'imdbId': movie.imdb_id,
                    'poster_url': movie.poster_url,
                    'duration': movie.duration,
                    'genres': genre_names,
                    'avg_rating': movie.avg_rating
                })
                
            self.logger.info(f"Prepared {len(ids)} movies for vector uploading.")
            self.add_vectors('movies', ids, docs)
        except Exception as e:
            self.logger.error(f"Error adding movie vectors: {e}")

    def load_data(self):
        self.logger.info("Starting data loading process...")
        self.create_collection('movies')
        self._add_movie_vectors()
        self.logger.info("Data loading completed.")

    def search_query(self, collection_name, vector, genres=None, top_k=10):
        try:
            search_params = models.SearchParams(exact=False)

            filter_conditions = None
            if genres and len(genres) > 1:
                selected_genres = genres[:2]
                filter_conditions = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="genres",
                            match=models.MatchAny(any=selected_genres)
                        )
                    ]
                )

            search_result = self.client.search(
                collection_name=collection_name,
                query_vector=vector,
                limit=top_k,
                search_params=search_params,
                query_filter=filter_conditions
            )

            payloads = [hit.payload for hit in search_result]

            if genres:
                first_two_genres = set(genres[:2])
                filtered_payloads = [
                    payload for payload in payloads if first_two_genres.issubset(set(payload.get('genres', [])))
                ]
            else:
                filtered_payloads = payloads

            return filtered_payloads
        except Exception as e:
            self.logger.error(f"Error searching collection: {e}")
            return []

    def get_movie_recommendations(self, movie_id, include_genre=False, top_k=10):
        cache_key = f"movie_recommendations_{movie_id}"
        cached_recommendations = cache.get(cache_key)

        if cached_recommendations:
            return cached_recommendations
    
        try:
            movie = Movie.objects.get(id=movie_id)
            vector = self.get_embeddings(movie.synopsis)

            recommendations = []
            genre_names = []

            if include_genre:
                genre_names = [genre.name for genre in movie.genres.all()]

            recs = self.search_query('movies', vector, genre_names, top_k=top_k)
            recommendations.extend([rec for rec in recs if rec['id'] != movie.id])

            unique_recommendations = {rec['id']: rec for rec in recommendations}.values()

            cache.set(cache_key, list(unique_recommendations), timeout=3600)

            return list(unique_recommendations)

        except Movie.DoesNotExist:
            self.logger.error(f"Movie with ID {movie_id} not found.")
            return []
        except Exception as e:
            self.logger.error(f"Error retrieving movie recommendations: {e}")
            return []
    
    def get_movies_by_plot(self, plot, top_k=20):
        try:
            vector = self.get_embeddings(plot)

            movies = self.search_query(collection_name='movies', vector=vector, top_k=top_k)

            unique_movies = {movie['id']: movie for movie in movies}.values()

            return list(unique_movies)
        except Movie.DoesNotExist:
            self.logger.error(f"Movie with plot {plot} not found.")
            return []
        except Exception as e:
            self.logger.error(f"Error retrieving movies: {e}")
            return []
        
    def close(self):
        self.client.close()

    