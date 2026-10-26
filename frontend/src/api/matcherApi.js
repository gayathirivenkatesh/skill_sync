import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/matcher`;

export const matchProject = async (projectId) => {
  const res = await axios.get(`${API}/match/${projectId}`);
  return res.data;
};
