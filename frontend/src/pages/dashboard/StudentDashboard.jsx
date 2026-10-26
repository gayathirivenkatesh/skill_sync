import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import TeamCard from "../../components/student/TeamCard";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../api/apiConfig";

const API_BASE = `${API_BASE_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API_BASE,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState({});
  const [skills, setSkills] = useState({});
  const [teams, setTeams] = useState([]);
  const [learningProgress, setLearningProgress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [statsRes, skillsRes, teamsRes, learningProgressRes] = await Promise.all([
        axiosInstance.get("/dashboard/stats"),
        axiosInstance.get("/dashboard/skills-distribution"),
        axiosInstance.get("/dashboard/my-teams"),
        axiosInstance.get("/dashboard/learning-progress"),
      ]);

      setStats(statsRes.data || {});
      setSkills(skillsRes.data?.skill_distribution || {});
      setTeams(teamsRes.data?.teams || []);
      setLearningProgress(learningProgressRes.data || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard. Please login again.");
    }
  };

  const StatCard = ({ title, value, to }) => {
    const accents = {
      Skills: "from-indigo-100 to-indigo-50 text-indigo-900",
      Teams: "from-emerald-100 to-emerald-50 text-emerald-900",
      Gamification: "from-amber-100 to-amber-50 text-amber-900",
      "Learning Progress": "from-purple-100 to-purple-50 text-purple-900",
    };

    return (
      <button
        type="button"
        onClick={() => to && navigate(to)}
        className={`
          rounded-2xl border bg-gradient-to-br p-5 text-left
          ${accents[title]}
          transition hover:shadow-lg
        `}
      >
        <p className="text-xs uppercase tracking-wide opacity-80">{title}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </button>
    );
  };

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100/40 p-4 sm:p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-indigo-900 sm:text-3xl">
            {user?.full_name ? `${user.full_name}'s Dashboard` : "Dashboard"}
          </h1>
          <p className="text-sm text-indigo-600">
            Track your learning journey, skills and teams
          </p>
        </div>

        {error && (
          <p className="mb-4 text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Skills" value={stats.skills_count || 0} to="/skill-mapper" />
          <StatCard title="Teams" value={teams.length} to="/team-builder" />
          <StatCard title="Gamification" value={stats.gamification_score || 0} to="/gamification" />
          <StatCard
            title="Learning Progress"
            value={`${learningProgress?.overall_progress ?? 0}%`}
            to="/learning-hub"
          />
        </div>

        <section className="mb-12 rounded-2xl border border-purple-100 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-purple-900">
            Learning Progress
          </h2>

          {!learningProgress ? (
            <p className="text-sm text-slate-500">No learning data yet</p>
          ) : (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                Overall Progress:
                <span className="font-semibold">
                  {" "}
                  {Math.round(learningProgress?.overall_progress || 0)}%
                </span>
              </p>
              <p>
                Skills Learned:
                <span className="font-semibold"> {learningProgress?.skills_learned || 0}</span>
              </p>
              <p>
                Gaps Remaining:
                <span className="font-semibold"> {learningProgress?.gaps_remaining || 0}</span>
              </p>
              <p>
                Resources Completed:
                <span className="font-semibold">
                  {" "}
                  {learningProgress?.completed_resources || 0} /{" "}
                  {learningProgress?.total_resources || 0}
                </span>
              </p>
            </div>
          )}
        </section>

        <section className="mb-12 rounded-2xl border border-indigo-100 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold text-indigo-900">
            Skill Distribution
          </h2>

          <div className="flex flex-wrap gap-2">
            {Object.keys(skills).length === 0 ? (
              <p className="text-sm text-slate-500">No skills added yet</p>
            ) : (
              Object.keys(skills).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
                >
                  {skill} ({skills[skill]})
                </span>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold text-emerald-900">My Teams</h2>

          {teams.length === 0 ? (
            <p className="text-slate-500">You are not part of any team yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {teams.map((team) => (
                <TeamCard key={team.team_id || team._id} team={team} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default StudentDashboard;
