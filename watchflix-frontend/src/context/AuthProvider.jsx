import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import PropTypes from "prop-types";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Load initial token data from localStorage
  const [auth, setAuth] = useState({
    username: localStorage.getItem("username") || "",
    accessToken: localStorage.getItem("accessToken") || "",
    refreshToken: localStorage.getItem("refreshToken") || "",
  });

  // Refresh access token if it's expired
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post("/token/refresh/", {
        refresh: auth.refreshToken,
      });
      const newAccessToken = response.data.access;

      setAuth((prevState) => ({
        ...prevState,
        accessToken: newAccessToken,
      }));

      localStorage.setItem("accessToken", newAccessToken);
    } catch (error) {
      console.error("Error refreshing access token", error);
      logout(); // Log out if refreshing token fails
    }
  };

  useEffect(() => {
    // Set up an interval to check token expiration and refresh if necessary
    const interval = setInterval(() => {
      if (auth.accessToken) {
        refreshAccessToken(); // Check token expiration and refresh if needed
      }
    }, 15 * 60 * 1000); // Check every 15 minutes

    return () => clearInterval(interval);
  }, [auth.accessToken]);

  // Login function
  const login = async (username, password) => {
    const user = {
      username,
      password,
    };

    try {
      const response = await axios.post("/token/", user, {
        headers: { "Content-Type": "application/json" },
      });

      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;

      setAuth({ username, accessToken, refreshToken });

      // Save tokens in localStorage
      localStorage.setItem("username", username);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      navigate("/"); 
      return { success: true, message: "" };
    } catch (error) {
      let errorMessage = "";

      if (!error.response) {
        errorMessage = "No server response";
      } else if (error.response.status === 400) {
        errorMessage = "Missing username or password";
      } else if (error.response.status === 401) {
        errorMessage = "Wrong username or password";
      } else {
        errorMessage = "Login failed";
      }

      console.error(error);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    setAuth({});
    navigate("/"); 
  };

  // Register function
  const register = async (user) => {
    try {
      const response = await axios.post("/accounts/register/", user, {
        headers: { "Content-Type": "application/json" },
      });

      return { success: true, message: "" };
    } catch (error) {
      let errorMessage = "";

      if (!error.response) {
        errorMessage = "No server response";
      } else if (error.response.status === 400) {
        if (error.response.data.username) {
          errorMessage = "Username already exists";
        } else if (error.response.data.email) {
          errorMessage = "Email already exists";
        } else {
          errorMessage = "Registration failed";
        }
      } else {
        errorMessage = "Registration failed";
      }

      console.error(error);
      return { success: false, message: errorMessage };
    }
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
