import axios from "axios";

const API = "fetch(`${import.meta.env.VITE_API_URL}/api/...`)/teams";

export const createTeam = async (payload) => {
  const res = await axios.post(`${API}/create`, payload);
  return res.data;
};

export const selectTeam = async (payload) => {
  const res = await axios.post(`${API}/select`, payload);
  return res.data;
};
