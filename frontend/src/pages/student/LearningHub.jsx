import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";

const API_BASE = "http://localhost:8000/api/learning";

/* ================= LEARNING HUB THEME ================= */
const theme = {
  page: "bg-gradient-to-br from-emerald-50 via-mint-50/50 to-teal-50/30",
  card: "bg-white border border-emerald-200",
  heading: "text-emerald-900",
  subText: "text-emerald-700",
  muted: "text-slate-500",

  resourceHover: "hover:bg-emerald-50",
  link: "text-emerald-700 hover:underline",

  badge: "bg-emerald-100 text-emerald-800",
};

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function LearningHub() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchLearningPlan = async () => {
    try {
      const res = await axiosInstance.get("/resources");
      setPlans(res.data.learning_plan || []);
      setMessage(res.data.message || "");
    } catch (err) {
      console.error("Error fetching plan:", err);
      setMessage("Failed to load learning resources.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningPlan();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-10 text-center text-emerald-700">
          ⏳ Fetching smart learning suggestions…
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={`min-h-screen p-6 rounded-xl ${theme.page}`}>

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.heading}`}>
            📚 Smart Learning Hub
          </h1>
          <p className={`text-sm mt-1 ${theme.subText}`}>
            Personalized resources to strengthen your skills step by step
          </p>
        </div>

        {/* Empty State */}
        {!plans.length && (
          <div className={`text-center mt-16 ${theme.muted}`}>
            🚀 {message || "Add skills to your profile to unlock learning paths."}
          </div>
        )}

        {/* Learning Plans */}
        <div className="space-y-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl shadow-sm ${theme.card}`}
            >
              <div className="mb-4">
                <h2 className={`text-xl font-semibold ${theme.heading}`}>
                  {plan.skill}
                </h2>
                <p className={`italic text-sm mt-1 ${theme.muted}`}>
                  {plan.summary || "No summary available."}
                </p>
              </div>

              <div className="space-y-3">
                {plan.resources.map((res, idx) => (
                  <div
                    key={idx}
                    className={`flex justify-between items-center border border-emerald-100 rounded-xl p-4 transition ${theme.resourceHover}`}
                  >
                    <div>
                      <h3 className="font-medium text-slate-800">
                        {res.title}
                      </h3>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm ${theme.link}`}
                      >
                        Visit Resource →
                      </a>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${theme.badge}`}
                    >
                      {res.status || "Not Started"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </MainLayout>
  );
}
