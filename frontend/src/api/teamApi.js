import axios from "axios";

const API = "http://localhost:8000/api/teams";

export const createTeam = async (payload) => {
  const res = await axios.post(`${API}/create`, payload);
  return res.data;
};

export const selectTeam = async (payload) => {
  const res = await axios.post(`${API}/select`, payload);
  return res.data;
};
