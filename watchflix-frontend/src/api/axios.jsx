import axios from "axios";

// Public instance (no authentication needed)
const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
});

export default axiosInstance;

// Private instance (requires authentication)
export const axiosPrivate = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosPrivate.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`; 
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 Unauthorized and refresh the token
axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a 401 error and that the request hasn't already been retried
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the refresh token
        const newAccessTokenResponse = await axios.post(
          "http://localhost:8000/api/token/refresh/",
          { refresh: localStorage.getItem("refreshToken") }, 
          { headers: { "Content-Type": "application/json" }, withCredentials: true }
        );

        if (newAccessTokenResponse.status === 200) {
          const newAccessToken = newAccessTokenResponse.data.access;

          localStorage.setItem("accessToken", newAccessToken);

          if (newAccessTokenResponse.data.refresh) {
            localStorage.setItem("refreshToken", newAccessTokenResponse.data.refresh);
          }

          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosPrivate(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed: ", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
