import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";

const API = "http://localhost:8000/api";

/* ================= THEME ================= */
const theme = {
  page: "bg-gradient-to-br from-stone-50 via-amber-50/40 to-emerald-50/30",
  card: "bg-white border border-stone-200",
  heading: "text-stone-900",
  subText: "text-stone-600",
  input:
    "border border-stone-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400",
  primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  secondaryBtn: "bg-amber-600 hover:bg-amber-700 text-white",
  accentText: "text-emerald-700",
  progressBg: "bg-stone-200",
  progressFill: "bg-emerald-500",
};

const RoleSimulator = () => {
  const token = localStorage.getItem("token");

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [task, setTask] = useState(null);
  const [reflection, setReflection] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Axios instance
  const axiosInstance = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch roles on mount
  useEffect(() => {
    axiosInstance
      .get("/role-simulator/roles")
      .then((res) => setRoles(res.data))
      .catch(() => setRoles([]));
  }, []);

  // Start a role
  const startRole = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/role-simulator/start/${selectedRole}`);
      setTask(res.data);
      setReflection("");
      setResult(null);
      setHasStarted(true); // mark that the user has started the role
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Submit reflection
  const submitReflection = async () => {
    if (!reflection.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/role-simulator/evaluate", {
        reflection: reflection.trim(),
        role: task.role,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className={`max-w-4xl mx-auto p-6 space-y-6 rounded-xl ${theme.page}`}>
        {/* Header */}
        <div className={`p-6 rounded-xl ${theme.card}`}>
          <h1 className={`text-2xl font-semibold ${theme.heading}`}>🎭 Role Simulator</h1>
          <p className={`text-sm mt-1 ${theme.subText}`}>
            Step into real professional roles and receive reflective AI feedback.
          </p>
        </div>

        {/* Step 1: Choose Role */}
        <div className={`p-6 rounded-xl ${theme.card}`}>
          <h2 className={`font-medium mb-3 ${theme.heading}`}>Choose a Role</h2>
          <div className="flex gap-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={`flex-1 ${theme.input}`}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <button
              onClick={startRole}
              disabled={!selectedRole || loading}
              className={`px-6 py-2 rounded-md text-sm ${theme.primaryBtn} disabled:opacity-50`}
            >
              Start
            </button>
          </div>
        </div>

        {/* Step 2: Today's Task (only after clicking Start) */}
        {hasStarted && task && (
          <div className={`p-6 rounded-xl ${theme.card}`}>
            <h2 className={`font-medium mb-2 ${theme.heading}`}>Today’s Task</h2>
            <p className={`font-medium ${theme.accentText}`}>{task.title}</p>
            <p className={`text-sm mt-2 ${theme.subText}`}>{task.description}</p>

            <textarea
              rows={5}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Explain your approach as if you were working in a real team..."
              className={`w-full mt-4 ${theme.input}`}
            />

            {/* Submit button appears only when reflection has text */}
            {reflection.trim().length > 0 && (
              <button
                onClick={submitReflection}
                className={`mt-4 px-6 py-2 rounded-md text-sm ${theme.secondaryBtn}`}
              >
                Submit Reflection
              </button>
            )}
          </div>
        )}

        {/* Step 3: Evaluation Result */}
        {result && (
          <div className={`p-6 rounded-xl ${theme.card}`}>
            <h2 className={`font-medium mb-4 ${theme.heading}`}>Evaluation Summary</h2>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-semibold text-emerald-600">{result.final_score}</span>
              <span className={`text-sm ${theme.subText}`}>/ 100 Overall Score</span>
            </div>

            <p className={`text-sm mb-5 ${theme.heading}`}>{result.feedback}</p>

            <h3 className={`text-sm font-medium mb-3 ${theme.heading}`}>Skill Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(result.skill_breakdown).map(([skill, score]) => (
                <div key={skill}>
                  <div className={`flex justify-between text-xs mb-1 ${theme.subText}`}>
                    <span>{skill}</span>
                    <span>{score}/25</span>
                  </div>
                  <div className={`w-full rounded-full h-2 ${theme.progressBg}`}>
                    <div
                      className={`h-2 rounded-full ${theme.progressFill}`}
                      style={{ width: `${(score / 25) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RoleSimulator;
