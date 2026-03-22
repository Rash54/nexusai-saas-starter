// src/lib/axios.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";

const axiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_BASE}`,
  headers: { "Content-Type": "application/json" },
  timeout: 35000,
});

// FIX: Read the token from cookie immediately at module initialization.
// This runs once when axios.ts is first imported on any page.
// Without this, the token only gets set during login — so on any page
// navigation (dashboard load, refresh, etc.) the axios instance starts
// with no Authorization header, every request gets a 401, then the
// interceptor kicks in to refresh. With this, the header is pre-loaded
// from the cookie before any request fires.
if (typeof window !== "undefined") {
  const existingToken = Cookies.get("access_token");
  if (existingToken) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${existingToken}`;
  }
}

// Request interceptor: keep token fresh on every request
// Secondary guard — the init above handles the first request,
// this handles token updates (e.g. after a refresh)
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 - attempt token refresh once
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refresh_token");
      if (!refreshToken) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;

        // Update cookie and axios instance default header
        Cookies.set("access_token", access_token, { expires: 1, sameSite: "strict" });
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return axiosInstance(originalRequest);
      } catch {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("org_id");
        delete axiosInstance.defaults.headers.common["Authorization"];
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Helpers for login/logout to update the instance header directly
export function setAuthToken(token: string) {
  axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export function clearAuthToken() {
  delete axiosInstance.defaults.headers.common["Authorization"];
}

export default axiosInstance;