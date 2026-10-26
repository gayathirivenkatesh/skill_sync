import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/analytics`;

export const getSkillDistribution = async () => {
  const res = await axios.get(`${API}/skills`);
  return res.data;
};

export const getProjectStats = async () => {
  const res = await axios.get(`${API}/projects`);
  return res.data;
};
