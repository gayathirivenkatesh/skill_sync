import axios from "axios";

const API_URL = "fetch(`${import.meta.env.VITE_API_URL}/api/...`)/auth";

export const register = async (userData) => {
  const res = await axios.post(`${API_URL}/register`, userData);
  return res.data;
};

export const login = async (credentials) => {
  const res = await axios.post(`${API_URL}/login`, credentials);
  return res.data;
};
