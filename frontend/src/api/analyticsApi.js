import axios from "axios";

const API = "fetch(`${import.meta.env.VITE_API_URL}/api/...`)/analytics";

export const getSkillDistribution = async () => {
  const res = await axios.get(`${API}/skills`);
  return res.data;
};

export const getProjectStats = async () => {
  const res = await axios.get(`${API}/projects`);
  return res.data;
};
