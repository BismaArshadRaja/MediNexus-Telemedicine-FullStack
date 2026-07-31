import axios from "axios";

// Point this at your running FastAPI backend (see telemedicine-backend/.env.example)
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT token (if we have one) to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medinexus_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend says our token is invalid/expired, clear it and send the
// user back to login instead of leaving them stuck on a broken page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("medinexus_token");
      localStorage.removeItem("medinexus_user");
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
