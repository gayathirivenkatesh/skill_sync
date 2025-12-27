import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";

/* ================= STUDENT GAMIFICATION THEME =================
   Playful • Warm • Connected to Student Ecosystem
*/
const studentGameTheme = {
  page: "bg-gradient-to-br from-peach-50 via-orange-50/70 to-rose-50/60",

  heading: "text-orange-900",
  subHeading: "text-orange-800",

  statCard: "bg-white border border-orange-200",
  statText: "text-orange-900",
  label: "text-orange-700",

  card: "bg-white border border-orange-200",

  loading: "text-orange-600",

  sessionAccent: "bg-orange-100 text-orange-800",
  feedbackAccent: "bg-rose-100 text-rose-800",

  bodyText: "text-slate-700",
  muted: "text-slate-500",
};

const Gamification = () => {
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/ai/gamification", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching gamification data:", err);
      }
    };
    fetchData();
  }, []);

  if (!data)
    return (
      <MainLayout>
        <div className={`p-6 text-center ${studentGameTheme.loading}`}>
          🎯 Loading gamification progress…
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className={`p-6 min-h-screen ${studentGameTheme.page}`}>

        {/* Header */}
        <h2 className={`text-2xl font-bold mb-6 ${studentGameTheme.heading}`}>
          🎮 Gamification Dashboard
        </h2>

        {/* Stats */}
        <div className={`p-5 rounded-xl shadow-sm mb-8 ${studentGameTheme.statCard}`}>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <p className={studentGameTheme.label}>Total XP</p>
              <p className={`text-xl font-semibold ${studentGameTheme.statText}`}>
                {data.total_xp}
              </p>
            </div>
            <div>
              <p className={studentGameTheme.label}>Overall Progress</p>
              <p className={`text-xl font-semibold ${studentGameTheme.statText}`}>
                {data.total_progress}%
              </p>
            </div>
            <div>
              <p className={studentGameTheme.label}>Completed Sessions</p>
              <p className={`text-xl font-semibold ${studentGameTheme.statText}`}>
                {data.completed_sessions}
              </p>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <h3 className={`text-xl font-semibold mb-3 ${studentGameTheme.subHeading}`}>
          📘 Active Learning Sessions
        </h3>
        <div className="grid gap-4 mb-8">
          {data.sessions.map((s, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg shadow-sm ${studentGameTheme.card}`}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-orange-900">{s.skill}</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${studentGameTheme.sessionAccent}`}
                >
                  {s.status}
                </span>
              </div>
              <p className={`text-sm ${studentGameTheme.bodyText}`}>
                Progress: <b>{s.progress}%</b>
              </p>
              <p className={`text-sm ${studentGameTheme.bodyText}`}>
                XP Earned: <b>{s.xp_earned}</b>
              </p>
            </div>
          ))}
        </div>

        {/* AI Feedback */}
        <h3 className={`text-xl font-semibold mb-3 ${studentGameTheme.subHeading}`}>
          💬 AI Feedback History
        </h3>
        <div className="space-y-4">
          {data.feedback_history.length > 0 ? (
            data.feedback_history.map((f, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg shadow-sm ${studentGameTheme.card}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-orange-900">{f.skill}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${studentGameTheme.feedbackAccent}`}
                  >
                    Score: {f.score}
                  </span>
                </div>
                <p className={`text-sm ${studentGameTheme.bodyText}`}>
                  <b>Question:</b> {f.question}
                </p>
                <p className={`text-sm ${studentGameTheme.bodyText}`}>
                  <b>Answer:</b> {f.answer}
                </p>
                <p className={`text-sm ${studentGameTheme.bodyText}`}>
                  <b>Feedback:</b> {f.comment}
                </p>
              </div>
            ))
          ) : (
            <p className={studentGameTheme.muted}>No feedback yet.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Gamification;
