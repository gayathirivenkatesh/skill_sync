import axios from "axios";

const API = "fetch(`${import.meta.env.VITE_API_URL}/api/...`)/badges";

export const getBadges = async (token) => {
  const res = await axios.get(API, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
