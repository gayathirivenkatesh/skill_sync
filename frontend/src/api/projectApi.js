import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/projects`;

export const getProjects = async () => {
  const res = await axios.get(API + "/");
  return res.data;
};

export const getProject = async (projectId) => {
  const res = await axios.get(`${API}/${projectId}`);
  return res.data;
};
