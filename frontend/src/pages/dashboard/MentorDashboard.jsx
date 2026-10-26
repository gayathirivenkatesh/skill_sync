import { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
  Users,
  Layers,
  CalendarCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../api/apiConfig";

const API_BASE = `${API_BASE_URL}/api`;

const MentorDashboard = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE}/mentor/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch {
      setError("Failed to load mentor dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800">
            Mentor Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Your mentoring overview at a glance
          </p>
        </div>

        {!loading && (
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800 hover:bg-emerald-100"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && <DashboardSkeleton />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
          <button
            onClick={fetchStats}
            className="ml-4 underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="My Mentees"
            value={stats.totalMentees}
            icon={Users}
            gradient="from-indigo-500 to-indigo-600"
            onClick={() => navigate("/mentor/my-mentees")}
          />
          <StatCard
            title="My Teams"
            value={stats.totalTeams}
            icon={Layers}
            gradient="from-teal-500 to-teal-600"
            onClick={() => navigate("/mentor/my-teams")}
          />
          <StatCard
            title="Sessions"
            value={stats.totalSessions}
            icon={CalendarCheck}
            gradient="from-emerald-500 to-emerald-600"
            onClick={() => navigate("/mentor/sessions")}
          />
          {/* Plagiarism Alerts with Redirect */}
          <StatCard
            title="Plagiarism Alerts"
            value={stats.plagiarismAlerts}
            icon={AlertTriangle}
            gradient="from-rose-500 to-rose-600"
            danger={stats.plagiarismAlerts > 0}
            onClick={() => navigate("/mentor/plagiarism")}
          />
        </div>
      )}
    </>
  );
};

/* ---------------- Components ---------------- */

const StatCard = ({ title, value, icon: Icon, gradient, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-left text-white shadow-lg ${gradient} ${
      onClick ? "transition hover:shadow-xl" : ""
    }`}
  >
    {danger && (
      <span className="absolute top-2 right-2 text-xs bg-white/20 px-2 py-0.5 rounded">
        Attention
      </span>
    )}
    <div className="flex items-center justify-between">
      <p className="text-sm opacity-90">{title}</p>
      <Icon size={22} className="opacity-90" />
    </div>
    <p className="mt-4 text-4xl font-bold">{value}</p>
  </button>
);

const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"
      />
    ))}
  </div>
);

export default MentorDashboard;
