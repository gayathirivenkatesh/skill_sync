import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/teams`;

export const createTeam = async (payload) => {
  const res = await axios.post(`${API}/create`, payload);
  return res.data;
};

export const selectTeam = async (payload) => {
  const res = await axios.post(`${API}/select`, payload);
  return res.data;
};
