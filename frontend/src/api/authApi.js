import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const API_URL = `${API_BASE_URL}/api/auth`;

export const register = async (userData) => {
  const res = await axios.post(`${API_URL}/register`, userData);
  return res.data;
};

export const login = async (credentials) => {
  const res = await axios.post(`${API_URL}/login`, credentials);
  return res.data;
};
