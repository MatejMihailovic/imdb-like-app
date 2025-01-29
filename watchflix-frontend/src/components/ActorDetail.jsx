import React, { useState, useEffect, useContext  } from 'react';
import { useParams } from 'react-router-dom';
import axiosPrivate from '../api/axios';
import MovieList from './movies/MovieList';
import AuthContext from '../context/AuthProvider';

const ActorDetail = () => {
  const { id } = useParams();
  const [actor, setActor] = useState(null);
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);

  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [message, setMessage] = useState('');
  const { auth } = useContext(AuthContext);
  
  const username = auth.username;

  useEffect(() => {
    const fetchActorDetails = async () => {
      try {
        const response = await axiosPrivate.get(`/actors/${id}`);
        setActor(response.data);
      } catch (err) {
        setError(err);
      }
    };

    const fetchActorMovies = async () => {
      try {
        const response = await axiosPrivate.get(`/actors/${id}/movies/`);
        setMovies(response.data.movies);
        setGenres(response.data.genres);
      } catch (err) {
        setError(err);
      }
    };

    fetchActorDetails();
    fetchActorMovies();
  }, [id]);

  useEffect(() => {
    const checkIfFollowing = async (actorId) => {
      try {
        const response = await axiosPrivate.get(`/actors/${actorId}/is-following/${username}`);
        setIsFollowing(response.data.is_following);
      } catch (err) {
        setError(err);
      }
    };

    if (actor) {
      checkIfFollowing(actor.id);
    }
  }, [actor, username]);

  const handleFollow = async () => {
    try {
      const response = await axiosPrivate.post(`/user-profiles/${username}/follow-actor/${id}/`);
      setIsFollowing(true);
      setMessage(response.data.message);
    } catch (err) {
      setError(err);
    }
  };

  if (error) return <div className="text-danger">Грешка: {error.message}</div>;

  return (
    <div className="container mt-5 text-light bg-dark">
      {actor && (
        <>
          <div>
            <h1 className="display-4 text-warning">{actor.first_name} {actor.last_name}</h1>
          </div>
          <p><strong>Година рођења:</strong> {actor.birth_year}</p>
          <button 
            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} my-3`} 
            onClick={handleFollow} 
            disabled={isFollowing}
          >
            {isFollowing ? 'Пратите' : 'Запрати глумца'}
          </button>
          {message && <div className="alert alert-success">{message}</div>}
        </>
      )}

      {movies.length > 0 ? (
        <MovieList title="Филмови" movies={movies} genres={genres} />
      ) : (
        <div className="text-light">Нема филмова за овог глумца.</div>
      )}
    </div>
  );
};

export default ActorDetail;
