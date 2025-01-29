import { useEffect } from "react";
import useAuth from "./useAuth";
import useRefreshToken from "./useRefreshToken";
import { axiosPrivate } from "../api/axios";

export const useAxiosPrivate = () => {
  const { auth } = useAuth();
  const { accessToken } = auth || {};
  const refresh = useRefreshToken();

  useEffect(() => {
    const requestInterceptor = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axiosPrivate.interceptors.response.use(
      (response) => {
        // If the response is OK, return it
        return response;
      },
      async (error) => {
        // If the response is not OK and the status is 401 (Unauthorized), try to refresh the token
        if (error.response && error.response.status === 401) {
          const newAccessToken = await refresh();

          // Update the request with the new access token and retry it
          error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosPrivate(error.config);
        }

        // If the response is not OK and the status is not 401, reject the promise
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestInterceptor);
      axiosPrivate.interceptors.response.eject(responseInterceptor);
    };
  }, [auth, refresh]);

  return axiosPrivate;
};

export default useAxiosPrivate;
