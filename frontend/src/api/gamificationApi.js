import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const API = `${API_BASE_URL}/api/badges`;

export const getBadges = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
