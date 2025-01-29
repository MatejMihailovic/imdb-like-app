import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/Search.css'; 
import { FaTimes } from 'react-icons/fa';  

const SearchDropdown = () => {
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('title'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchFilteredMovies = async (query) => {
    setLoading(true);
    setError(null);
    try {
      if (searchBy !== "") {
        const encodedQuery = encodeURIComponent(query);
        navigate(`/movies?query=${encodedQuery}&searchBy=${searchBy}`);
      }
    } catch (error) {
      setError('Грешка приликом добављања филмова.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSearch(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (search !== '') {
        fetchFilteredMovies(search);
      }
    }
  };

  const handleSearchClick = () => {
    if (search !== '') {
      fetchFilteredMovies(search);
    }
  };

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <div className="search-bar-container mt-2">
      <div className="input-group">
        <select
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
          className="search-dropdown"
        >
          <option value="title">По наслову</option>
          <option value="plot">По радњи</option>
        </select>
        <div className="search-input-wrapper me-3">
          <input
            type="text"
            className="search-input"
            placeholder="Претражи филмове..."
            value={search}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <FaTimes
            className={`clear-icon ${search !== '' ? 'visible' : ''}`}
            onClick={clearSearch}
          />
        </div>
        <button className="search-button" type="button" onClick={handleSearchClick}>
          Претрага
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default SearchDropdown;
