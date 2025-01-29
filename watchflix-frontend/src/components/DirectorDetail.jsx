import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axiosPrivate from '../api/axios';
import MovieList from './movies/MovieList';
import AuthContext from '../context/AuthProvider';

const DirectorDetail = () => {
  const { id } = useParams();
  const [director, setDirector] = useState(null);
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const { auth } = useContext(AuthContext);
  
  const username = auth.username;

  useEffect(() => {
    const fetchDirectorDetails = async () => {
      try {
        const response = await axiosPrivate.get(`/directors/${id}`);
        setDirector(response.data);
      } catch (err) {
        setError(err);
      }
    };

    const fetchDirectorMovies = async () => {
      try {
        const response = await axiosPrivate.get(`/directors/${id}/movies/`);
        setMovies(response.data.movies);
        setGenres(response.data.genres);
      } catch (err) {
        setError(err);
      }
    };

    fetchDirectorDetails();
    fetchDirectorMovies();
  }, [id]);

  // Check follow status only after director data is fetched
  useEffect(() => {
    const checkIfFollowing = async (directorId) => {
      try {
        const response = await axiosPrivate.get(`/directors/${directorId}/is-following/${username}`);
        setIsFollowing(response.data.is_following);
      } catch (err) {
        setError(err);
      }
    };

    if (director) {
      checkIfFollowing(director.id);
    }
  }, [director, username]);

  const handleFollow = async () => {
    try {
      const response = await axiosPrivate.post(`/user-profiles/${username}/follow-director/${id}/`);
      setIsFollowing(true);
      setMessage(response.data.message);
    } catch (err) {
      setError(err);
    }
  };

  if (error) return <div className="text-danger">Грешка: {error.message}</div>;

  return (
    <div className="container mt-5 text-light bg-dark">
      {director && (
        <>
          <h1 className="display-4 text-warning">{director.first_name} {director.last_name}</h1>
          <p><strong>Година рођења:</strong> {director.birth_year}</p>
          <button 
            className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} my-3`} 
            onClick={handleFollow} 
            disabled={isFollowing}
          >
            {isFollowing ? 'Пратите' : 'Запрати режисера'}
          </button>
          {message && <div className="alert alert-success">{message}</div>}
        </>
      )}

      {movies.length > 0 ? (
        <MovieList title="Филмови" movies={movies} genres={genres} />
      ) : (
        <div className="text-light">Нема филмова за овог режисера.</div>
      )}
    </div>
  );
};

export default DirectorDetail;
