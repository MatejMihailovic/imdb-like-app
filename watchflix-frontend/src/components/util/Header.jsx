import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import useAuth from "../../hooks/useAuth";
import SearchDropdown from './Search'; 
import axiosPrivate from '../../api/axios';  // Make sure to import axiosPrivate for API calls
import '../../assets/Header.css';

export default function Header() {
  const { auth, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const checkAdminStatus = async () => {
    try {
      const response = await axiosPrivate.get(`/user-profiles/${auth.username}/is-admin/`);
      setIsAdmin(response.data.is_admin);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);  
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    if (auth?.username) {
      checkAdminStatus();  
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, auth]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark">
      <div className="container-fluid">
        <a className="navbar-brand text-warning" href={isAdmin ? "/admin" : "/home"}>
          <strong>WatchFlix</strong>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          {auth.username ? (
            <>
              <div className="d-flex justify-content-center mx-auto">
                <SearchDropdown />
              </div>
              <ul className="navbar-nav ms-3">
                <li className="nav-item dropdown dropstart" ref={dropdownRef}>
                  <button
                    className="text-white bg-transparent border-0 dropdown-toggle"
                    onClick={toggleDropdown}
                  >
                    <FaUserCircle size={35} />
                  </button>
                  {showDropdown && (
                    <ul className="dropdown-menu show">
                      <li><a className="dropdown-item" href="/profile">Мој профил</a></li>
                      <li><button className="dropdown-item" onClick={logout}>Одјава</button></li>
                    </ul>
                  )}
                </li>
              </ul>
            </>
          ) : (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link text-white" href="/login">
                  Пријављивање
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
