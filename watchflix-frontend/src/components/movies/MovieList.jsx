import React, { useState, useEffect } from 'react';  
import MovieCard from './MovieCard';
import axiosPrivate from '../../api/axios';  

export default function MovieList({ title, movies, genres }) {
  const [sortedMovies, setSortedMovies] = useState([]); 
  const [sortCriteria, setSortCriteria] = useState('default'); 
  const [sortOrder, setSortOrder] = useState('asc'); 
  const [selectedGenres, setSelectedGenres] = useState([]); 

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);

  const toggleSortDropdown = () => setIsSortDropdownOpen(!isSortDropdownOpen);
  const toggleOrderDropdown = () => setIsOrderDropdownOpen(!isOrderDropdownOpen);

  const fetchMoviePopularity = async (movieId) => {
    try {
      const response = await axiosPrivate.get(`/watch-history/get-popularity/${movieId}/`);
      return response.data.popularity;
    } catch (error) {
      console.error("Error fetching popularity:", error);
      return 0; 
    }
  };

  const handleGenreChange = (genre) => {
    if (genre === "") {
      setSelectedGenres([]);  
    } else {
      setSelectedGenres((prevGenres) =>
        prevGenres.includes(genre)
          ? prevGenres.filter((g) => g !== genre)
          : [...prevGenres, genre]
      );
    }
  };

  useEffect(() => {
    const updateMoviesWithPopularity = async () => {
      let updatedMovies = [...movies];

      if (sortCriteria === 'popularity') {
        const updatedMoviesWithPopularity = await Promise.all(
          updatedMovies.map(async (movie) => {
            const movieObj = movie.movie || movie;  

            if (!('popularity' in movieObj)) {
              const popularity = await fetchMoviePopularity(movieObj.id);
              return { ...movieObj, popularity };
            }

            return movieObj;
          })
        );
        updatedMovies = updatedMoviesWithPopularity;
      }

      // Filter by selected genres
      updatedMovies = updatedMovies.filter((movie) => {
        const movieObj = movie.movie || movie;
        if (selectedGenres.length === 0) return true;  
        return movieObj.genres?.some((genre) => selectedGenres.includes(genre));
      });

      // Sort movies
      updatedMovies.sort((a, b) => {
        const movieA = a.movie || a; 
        const movieB = b.movie || b;

        if (sortCriteria === 'year') {
          return sortOrder === 'asc' 
            ? movieA.release_year - movieB.release_year 
            : movieB.release_year - movieA.release_year;
        } else if (sortCriteria === 'avg_rating') {
          return sortOrder === 'asc' 
            ? movieA.avg_rating - movieB.avg_rating 
            : movieB.avg_rating - movieA.avg_rating;
        } else if (sortCriteria === 'popularity') {
          return sortOrder === 'asc' 
            ? (movieA.popularity || 0) - (movieB.popularity || 0) 
            : (movieB.popularity || 0) - (movieA.popularity || 0);
        }
        return 0;
      });

      setSortedMovies(updatedMovies);
    };

    updateMoviesWithPopularity();
  }, [movies, sortCriteria, sortOrder, selectedGenres]);

  return (
    <section className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center">
          <h3 className="text-warning me-4"><strong>{title}</strong></h3>

          
          <div className="genres-container me-4 mt-3">
            <button 
              className={`btn btn-outline-light ${selectedGenres.length === 0 ? 'active' : ''}`} 
              onClick={() => handleGenreChange('')}
            >
              Сви жанрови
            </button>
            {genres.map((genre) => (  
              <button 
                key={genre} 
                className={`btn btn-outline-light ${selectedGenres.includes(genre) ? 'active' : ''}`} 
                onClick={() => handleGenreChange(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        <div className="d-flex mb-3">
          <div className="me-2">
            <label className="text-light me-1">Сортирај по:</label>
            <select 
              className="form-select bg-dark text-light" 
              value={sortCriteria} 
              onChange={(e) => setSortCriteria(e.target.value)}
            >
              <option value="default">Без сортирања</option>
              <option value="year">Година</option>
              <option value="avg_rating">Оцена</option>
              <option value="popularity">Популарност</option>
            </select>
          </div>

          <div className="me-2">
            <label className="text-light me-1">Редослед:</label>
            <select 
              className="form-select bg-dark text-light" 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Растући</option>
              <option value="desc">Опадајући</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card-group d-flex flex-nowrap overflow-auto position-relative">
        {sortedMovies.map((movie, index) => (
          <div 
            className="col-6 col-sm-4 col-md-4 col-lg-2 d-flex flex-column m-2 justify-content-between" 
            key={movie.movie?.id || movie.id || index} 
          >
            <MovieCard movie={movie.movie || movie} rating={movie.rating} timestamp={movie.timestamp} />
          </div>
        ))}
      </div>
    </section>
  );
};
