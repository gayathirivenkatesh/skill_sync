// src/api/userApi.js
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// Attach JWT token for every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("Token being sent:", token); // 🔹 debug
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// -------------------- User APIs --------------------

// Get user profile
export const getProfile = async () => {
  try {
    const res = await axiosInstance.get("/users/profile");
    return res.data;
  } catch (err) {
    console.error("Error fetching profile:", err);
    throw err;
  }
};

// Get user activity feed
export const getActivityFeed = async () => {
  try {
    const res = await axiosInstance.get("/users/activity");
    return res.data.activities || [];
  } catch (err) {
    console.error("Error fetching activity feed:", err);
    return [];
  }
};

// Update skills
export const updateSkills = async (skills) => {
  try {
    const res = await axiosInstance.put("/users/update_skills", { skills });
    return res.data;
  } catch (err) {
    console.error("Error updating skills:", err);
    throw err;
  }
};

// Extract skills from text (resume copy-paste)
export const extractSkillsFromText = async (text) => {
  try {
    const res = await axiosInstance.post("/users/resume-parser", { text });
    return res.data.skills || [];
  } catch (err) {
    console.error("Error extracting skills from text:", err);
    return [];
  }
};

// -------------------- Extract Skills & Jobs --------------------
export const extractSkillsAndJobs = async (text) => {
  try {
    const res = await axiosInstance.post("/skills/extract", { text });
    return res.data;
  } catch (err) {
    console.error("Error extracting skills & jobs:", err);
    throw err;
  }
};


// -------------------- Matcher APIs --------------------
// Get recommended project matches
export const getProjectMatches = async () => {
  try {
    const res = await axiosInstance.get("/matcher/matches");
    return res.data.matches || [];
  } catch (err) {
    console.error("Error fetching project matches:", err);
    return [];
  }
};

// -------------------- Analytics APIs --------------------
// Get personalized recommendations
export const getRecommendations = async () => {
  try {
    const res = await axiosInstance.get("/analytics/recommendations");
    return res.data.recommendations || [];
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    return [];
  }
};

// Get skill distribution analytics
export const getSkillDistribution = async () => {
  try {
    const res = await axiosInstance.get("/analytics/skills");
    return res.data.skill_distribution || [];
  } catch (err) {
    console.error("Error fetching skill distribution:", err);
    return [];
  }
};

// Export everything
export default {
  getProfile,
  getActivityFeed,
  updateSkills,
  extractSkillsFromText,
  extractSkillsAndJobs,
  getProjectMatches,
  getRecommendations,
  getSkillDistribution,
};
