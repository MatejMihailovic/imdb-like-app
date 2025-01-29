import axios from "../api/axios";
import useAuth from "./useAuth";

const useRefreshToken = () => {
  const { auth, setAuth } = useAuth();
  const { refreshToken } = auth || {};

  const refresh = async () => {
    const response = await axios.post(
      "/token/refresh/",
      { refresh: refreshToken },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    setAuth((prev) => {
      return { ...prev, accessToken: response.data.access };
    });

    return response.data.access;
  };

  return refresh;
};

export default useRefreshToken;
