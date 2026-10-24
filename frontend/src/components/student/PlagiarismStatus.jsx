import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { ShieldCheck, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const riskStyles = {
  "Low Risk": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "#16a34a",
    bar: "bg-emerald-600",
  },
  "Medium Risk": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "#ca8a04",
    bar: "bg-amber-500",
  },
  "High Risk": {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "#dc2626",
    bar: "bg-red-600",
  },
};

const PlagiarismStatus = ({ teamId }) => {
  const { token } = useContext(AuthContext);

  const [plagiarism, setPlagiarism] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChecked, setHasChecked] = useState(false);

  const runPlagiarismCheck = async () => {
    if (!teamId || !token) return;

    setLoading(true);
    setError("");
    setHasChecked(true);

    try {
      const res = await axios.get(
        `${API_BASE}/team/plagiarism/${teamId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlagiarism(res.data);
    } catch {
      setError("Unable to run plagiarism check. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- INITIAL ---------- */
  if (!hasChecked) {
    return (
      <div className="rounded-2xl border bg-white shadow-sm p-6 text-center space-y-4">
        <ShieldCheck className="mx-auto text-slate-400" size={40} />
        <h3 className="text-lg font-semibold">Plagiarism Analysis</h3>
        <p className="text-sm text-slate-500">
          Analyze the latest submission against known sources.
        </p>

        <button
          onClick={runPlagiarismCheck}
          className="px-5 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900"
        >
          Run Check
        </button>
      </div>
    );
  }

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="rounded-2xl border bg-white shadow-sm p-6 text-center text-slate-500">
        🔍 Running plagiarism analysis…
      </div>
    );
  }

  /* ---------- ERROR ---------- */
  if (error) {
    return (
      <div className="rounded-2xl border bg-red-50 text-red-700 p-6 text-center">
        {error}
        <div className="mt-4">
          <button
            onClick={runPlagiarismCheck}
            className="px-4 py-1 rounded bg-red-600 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!plagiarism) return null;

  const style = riskStyles[plagiarism.status] || riskStyles["Low Risk"];
  const circumference = 264;
  const offset =
    circumference - (plagiarism.score / 100) * circumference;

  /* ---------- REPORT ---------- */
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plagiarism Report</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}
        >
          {plagiarism.status}
        </span>
      </div>

      {/* Meter */}
      <div className="flex gap-6 items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="46"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="56"
              cy="56"
              r="46"
              stroke={style.ring}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
            {plagiarism.score}%
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-slate-500">Similarity Index</p>
          <p className="text-slate-700 mt-1">
            <strong>{plagiarism.score}%</strong> similarity detected across
            known sources.
          </p>

          <div className="w-full h-3 bg-gray-200 rounded-full mt-3">
            <div
              className={`h-3 rounded-full ${style.bar}`}
              style={{ width: `${plagiarism.score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-t pt-3">
        <span>
          Last checked:{" "}
          {plagiarism.checked_at &&
            new Date(plagiarism.checked_at).toLocaleString()}
        </span>

        <button
          onClick={runPlagiarismCheck}
          className="flex items-center gap-1 text-slate-700 hover:underline"
        >
          <RefreshCw size={14} />
          Re-run
        </button>
      </div>
    </div>
  );
};

export default PlagiarismStatus;
