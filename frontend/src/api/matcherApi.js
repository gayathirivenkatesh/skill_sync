import axios from "axios";

const API = "fetch(`${import.meta.env.VITE_API_URL}/api/...`)/matcher";

export const matchProject = async (projectId) => {
  const res = await axios.get(`${API}/match/${projectId}`);
  return res.data;
};
