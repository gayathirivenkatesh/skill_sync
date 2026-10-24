import axios from "axios";

const API = "http://localhost:8000/api/badges";

export const getBadges = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
