import axios from "axios";

const API = "http://localhost:8000/api/matcher";

export const matchProject = async (projectId) => {
  const res = await axios.get(`${API}/match/${projectId}`);
  return res.data;
};
