import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { AuthContext } from "../../context/AuthContext";

const CareerPathways = () => {
  const { token } = useContext(AuthContext);
  const [pathways, setPathways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Axios instance with token
  const axiosInstance = axios.create({
    baseURL: "http://localhost:8000/api/career-pathways",
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    const fetchPathways = async () => {
      try {
        const res = await axiosInstance.get("/");
        setPathways(res.data.pathways);
      } catch (err) {
        console.error("Error fetching career pathways:", err);
        setError(err.response?.data?.detail || "Failed to fetch career pathways");
      } finally {
        setLoading(false);
      }
    };

    fetchPathways();
  }, [token]);

  if (loading)
    return (
      <MainLayout>
        <p className="text-center text-lg mt-8">⏳ Generating your career pathways...</p>
      </MainLayout>
    );

  if (error)
    return (
      <MainLayout>
        <p className="text-center text-red-600 mt-8">{error}</p>
      </MainLayout>
    );

  if (!pathways.length)
    return (
      <MainLayout>
        <p className="text-center text-gray-600 mt-8">No career pathways available.</p>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-green-700 mb-4">Career Pathways</h1>

        {pathways.map((track, idx) => (
          <div
            key={idx}
            className="p-4 bg-white rounded-2xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold text-emerald-600">{track.title}</h2>
            <p className="text-gray-600 italic mb-2">{track.description}</p>

            <div className="flex flex-wrap gap-2 mb-2">
              {track.industries.map((industry, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                >
                  {industry}
                </span>
              ))}
            </div>

            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Alignment: {track.alignment_score}%</span>
              <span className="text-sm font-medium">Growth Score: {track.growth_score}/10</span>
            </div>

            <div>
              <strong className="text-sm">Recommended Skills to Learn:</strong>
              {track.recommended_skills.length > 0 ? (
                <ul className="list-disc list-inside text-sm mt-1">
                  {track.recommended_skills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm mt-1">You already have all core skills!</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

export default CareerPathways;
