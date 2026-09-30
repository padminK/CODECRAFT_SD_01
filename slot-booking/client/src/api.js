import axios from "axios";
import { handleMockRequest } from "./mockService";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({ baseURL, timeout: 8000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend is unreachable or not deployed yet (e.g. GitHub Pages standalone)
    if (
      !error.response ||
      error.code === "ERR_NETWORK" ||
      error.message === "Network Error" ||
      error.response.status === 404 ||
      error.response.status === 502 ||
      error.response.status === 503
    ) {
      try {
        const mockRes = handleMockRequest(error.config);
        if (mockRes) {
          console.info(
            "[Demo Mode] Serving request in-browser:",
            error.config.method?.toUpperCase(),
            error.config.url
          );
          return Promise.resolve(mockRes);
        }
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
