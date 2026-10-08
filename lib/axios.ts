import axios from "axios";
import { USERS } from "@/constants/api.constant";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("refreshToken");
        
        if (refreshToken) {
          try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}${USERS.refreshToken}`, { token: refreshToken });
            
            if (res.data.success && res.data.accessToken) {
              localStorage.setItem("accessToken", res.data.accessToken);
              originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh token failed, clear tokens and redirect
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            if (window.location.pathname !== "/") {
              window.location.href = "/";
            }
            return Promise.reject(refreshError);
          }
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
