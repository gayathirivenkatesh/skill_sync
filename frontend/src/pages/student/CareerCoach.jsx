import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MainLayout from "../../layouts/MainLayout";
import { Loader2, Bot, User } from "lucide-react";

const API_BASE = "http://localhost:8000/api/careercoach";

/* ================= CAREER COACH THEME =================
   Warm • Professional • Mentor-like • Student Connected
*/
const coachTheme = {
  page: "bg-gradient-to-br from-amber-50 via-emerald-50/40 to-sky-50",

  card: "bg-white border border-amber-200 shadow-xl",
  innerCard: "bg-amber-50/60 border border-amber-200",

  heading: "text-amber-900",
  subHeading: "text-emerald-800",

  body: "text-slate-700",
  muted: "text-slate-500",

  primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  secondaryBtn: "bg-sky-600 hover:bg-sky-700 text-white",

  accentBot: "text-emerald-600",
  accentUser: "text-sky-600",

  timelineCard: "bg-white border border-slate-200",
};

/* ---------- Simple UI Components ---------- */
const Card = ({ children, className }) => (
  <div className={`rounded-2xl p-5 ${coachTheme.card} ${className || ""}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="border-b border-amber-200 pb-3 mb-4">{children}</div>
);

const CardContent = ({ children }) => <div>{children}</div>;

const Button = ({ children, onClick, disabled, variant = "primary" }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-5 py-2 rounded-xl font-semibold transition ${
      disabled
        ? "bg-slate-300 cursor-not-allowed text-slate-600"
        : variant === "primary"
        ? coachTheme.primaryBtn
        : coachTheme.secondaryBtn
    }`}
  >
    {children}
  </button>
);

/* ---------- Main Component ---------- */
export default function CareerCoach() {
  const [coachData, setCoachData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewTimeline, setViewTimeline] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/insights`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to fetch");
      setCoachData(data);
      fetchTimeline();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`${API_BASE}/timeline`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (response.ok) setTimeline(data.timeline || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  return (
    <MainLayout>
      <div className={`min-h-screen ${coachTheme.page} flex justify-center p-6`}>
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <motion.h1
              className={`text-2xl font-bold flex items-center justify-center gap-2 ${coachTheme.heading}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Bot className={coachTheme.accentBot} size={28} />
              Your Career Coach
            </motion.h1>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Loading */}
            {loading && (
              <div className="flex justify-center items-center gap-3 py-8">
                <Loader2 className="animate-spin text-emerald-600" />
                <p className={coachTheme.muted}>Analyzing your profile…</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-rose-100 text-rose-700 p-4 rounded-lg text-center">
                ⚠️ {error}
              </div>
            )}

            {/* AI Result */}
            {coachData && !loading && (
              <motion.div
                className={`rounded-xl p-5 space-y-4 ${coachTheme.innerCard}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-2">
                  <User className={coachTheme.accentUser} />
                  <h2 className="font-semibold text-slate-800">
                    Hi {coachData.user_name} 👋
                  </h2>
                </div>

                <p className={`${coachTheme.body} whitespace-pre-line leading-relaxed`}>
                  {coachData.ai_message}
                </p>

                <div className="pt-3 border-t border-amber-200 text-sm">
                  <p>
                    💼 Career Readiness:{" "}
                    <span className="font-semibold text-emerald-700">
                      {coachData.readiness_score}%
                    </span>
                  </p>
                  <p className={coachTheme.muted}>🕓 {coachData.timestamp}</p>
                </div>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={fetchInsights} disabled={loading}>
                {loading ? "Generating…" : "Generate New Insight"}
              </Button>
              <Button
                onClick={() => setViewTimeline(!viewTimeline)}
                variant="secondary"
              >
                {viewTimeline ? "Hide Timeline" : "View Timeline"}
              </Button>
            </div>

            {/* Timeline */}
            {viewTimeline && (
              <motion.div
                className={`p-4 rounded-xl space-y-3 ${coachTheme.timelineCard}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className={`font-semibold ${coachTheme.subHeading}`}>
                  📜 Career Timeline
                </h3>

                {timeline.length === 0 ? (
                  <p className={coachTheme.muted}>No insights yet.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {timeline.map((item) => (
                      <div
                        key={item._id}
                        className="border border-slate-200 rounded-lg p-3 hover:bg-amber-50 transition"
                      >
                        <p className="text-sm text-slate-700 whitespace-pre-line">
                          {item.ai_message.slice(0, 160)}…
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Score: {item.readiness_score}% • {item.timestamp}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
