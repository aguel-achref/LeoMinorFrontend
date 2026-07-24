import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
});

// Intercepteur de requête : ajoute automatiquement le token s'il existe
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse : si le token est invalide/expiré, on déconnecte proprement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      window.location.href = "/authentication/sign-in";
    }
    return Promise.reject(error);
  }
);

export default api;
