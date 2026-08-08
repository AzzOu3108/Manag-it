import axios from "axios";
import { mockAdapter } from "./mockApi";

/**
 * Central API client for the whole app.
 *
 * Every request goes through this axios instance so that:
 *  - the base URL is configured in one place (VITE_API_URL or the dev proxy),
 *  - the access token is attached automatically,
 *  - a 401 triggers a silent refresh-token exchange and retries the request,
 *  - a failed refresh logs the user out and sends them to /login.
 *
 * Backend contract (Express):
 *  POST /auth/signup  { fullName, email, password }        -> { accessToken, refreshToken, user }
 *  POST /auth/login   { email, password }                  -> { accessToken, refreshToken, user }
 *  POST /auth/refresh { refreshToken }                     -> { accessToken }
 *  POST /auth/logout  { refreshToken }                     -> 204
 *  GET  /auth/me                                          -> { user }
 *  GET  /projects                                         -> Project[]
 *  POST /projects     { title, dueDate, tasks: string[] } -> Project
 *  DELETE /projects/:projectId                             -> 204
 *  POST /projects/:projectId/tasks  { tasks: string[] }    -> Project (updated)
 *  PATCH /projects/:projectId/tasks/:taskId { completed }  -> Task
 *  GET  /stats                                            -> { totalProjects, completedTasks, pendingTasks }
 *
 * Shapes: Project { id, title, dueDate: "YYYY-MM-DD", tasks: Task[] }
 *         Task    { id, text, completed }
 * Errors: { error: "human readable message" } with the right status code.
 */

/**
 * MOCK MODE — set to false once your Express backend is running.
 * While true, every request is answered by src/lib/mockApi.js
 * (in-memory data, persisted in localStorage) so the app is fully
 * usable without a server.
 */
const USE_MOCK_API = true;

/** Base URL: override with VITE_API_URL, otherwise hit the Vite dev proxy (/api). */
const API_URL = import.meta.env.VITE_API_URL || "/api";

/* localStorage keys for the two tokens. */
const ACCESS_TOKEN_KEY = "manageit.accessToken";
const REFRESH_TOKEN_KEY = "manageit.refreshToken";

/* ------------------------------------------------------------------ */
/* Token helpers                                                       */
/* ------------------------------------------------------------------ */

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Persist both tokens after login/signup/refresh. */
export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/** Remove both tokens (logout, failed refresh). */
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** A session exists as long as a refresh token is stored. */
export function isAuthenticated() {
  return Boolean(getRefreshToken());
}

/* ------------------------------------------------------------------ */
/* Axios instance + interceptors                                       */
/* ------------------------------------------------------------------ */

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// While the backend is not running, answer every request from the mock.
if (USE_MOCK_API) {
  api.defaults.adapter = mockAdapter;
}

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Single-flight refresh: when several requests 401 at the same time
 * (e.g. the dashboard fires /projects and /stats together), they all
 * share ONE refresh call instead of hammering the server.
 */
let refreshPromise = null;

/** Exchange the stored refresh token for a fresh access token. */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");

  // Reuse the in-flight refresh if one is already running.
  refreshPromise =
    refreshPromise ||
    api
      .post("/auth/refresh", { refreshToken })
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null;
      });

  const { accessToken } = await refreshPromise;
  setTokens(accessToken, refreshToken);
  return accessToken;
}

/** Send the user to the login page after a failed refresh. */
function redirectToLogin() {
  clearTokens();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Only 401s trigger a refresh; never retry auth calls themselves
    // (a bad login must surface its own error, not loop forever).
    const isAuthCall = original?.url?.includes("/auth/");
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      const accessToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original); // retry the original request with the fresh token
    } catch (refreshError) {
      // Only bounce to /login when a session existed but could not be
      // refreshed. With no session at all (public dashboard), the error
      // just surfaces in the UI instead of redirecting.
      if (getRefreshToken()) redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * Pull a human-readable message out of any error.
 * Prefers the backend's { error } body, falls back to the axios message.
 */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return error?.response?.data?.error || error?.message || fallback;
}

/**
 * Log out: best-effort revoke of the refresh token on the server,
 * then always clear local tokens. Never throws.
 */
export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await api.post("/auth/logout", { refreshToken });
  } catch {
    // Server unreachable or already expired — local cleanup still happens.
  } finally {
    clearTokens();
  }
}

export default api;