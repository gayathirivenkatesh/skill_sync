import axios from "axios";

const API = "fetch(`${import.meta.env.VITE_API_URL}/api/...`)/projects";

export const getProjects = async () => {
  const res = await axios.get(API + "/");
  return res.data;
};

export const getProject = async (projectId) => {
  const res = await axios.get(`${API}/${projectId}`);
  return res.data;
};
