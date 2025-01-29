import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axiosPrivate from '../../api/axios';
import MovieCard from './MovieCard'; // Assuming you have a MovieCard component

const MoviesPage = () => {
  const location = useLocation();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Extract query and searchBy from the URL parameters
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('query');
  const searchBy = queryParams.get('searchBy') || 'title';

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const encodedQuery = encodeURIComponent(query);
        const response = await axiosPrivate.get(`/movie/search?query=${encodedQuery}&searchBy=${searchBy}`);
        setMovies(response.data);
      } catch (error) {
        setError('Грешка приликом добављања филмова.');
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchMovies();
    }
  }, [query, searchBy]);

  return (
    <div className="container mt-5">
      <h2 className="text-warning text-center mb-4">
        Резултати претраге: {searchBy === 'title' ? `наслов "${query}"` : `радња "${query}"`}
      </h2>

      {loading && <p className="text-center text-light">Учитавање...</p>}
      {error && <p className="text-center text-danger">{error}</p>}

      {!loading && movies.length === 0 && <p className="text-center text-light">Нема пронађених филмова.</p>}

      <div className="row">
        {movies.map((movie) => (
          <div className="col-md-4 col-lg-3 mb-4" key={movie.id}>
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoviesPage;
