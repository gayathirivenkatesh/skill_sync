// Centralized API configuration for SkillSync
// In production, VITE_API_URL is set to the Render backend URL.
// In development, it falls back to localhost.

const rawApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Strip any trailing slashes for consistent URL building
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

// Helper to build a full API URL from a relative path
// Usage: apiUrl("api/auth/register") → "https://skillsync-y7e3.onrender.com/api/auth/register"
export const apiUrl = (path) =>
  `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
