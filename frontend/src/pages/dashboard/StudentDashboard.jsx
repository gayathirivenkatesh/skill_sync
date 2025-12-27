import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import TeamCard from "../../components/student/TeamCard";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const API_BASE = "http://localhost:8000/api";

/* ================= AXIOS INSTANCE ================= */
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ================= DASHBOARD ================= */
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState({});
  const [appreciations, setAppreciations] = useState([]);
  const [skills, setSkills] = useState({});
  const [teams, setTeams] = useState([]);

  // ⭐ NEW
  const [learningProgress, setLearningProgress] = useState(null);

  const [teamFiles, setTeamFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

const fetchDashboard = async () => {
  try {
    const [
      statsRes,
      skillsRes,
      teamsRes,
      learningProgressRes
    ] = await Promise.all([
      axiosInstance.get("/dashboard/stats"),
      axiosInstance.get("/dashboard/skills-distribution"),
      axiosInstance.get("/dashboard/my-teams"),
      axiosInstance.get("/dashboard/learning-progress"),
    ]);

    setStats(statsRes.data || {});
    setSkills(skillsRes.data?.skill_distribution || {});
    setTeams(teamsRes.data?.teams || []);
    setLearningProgress(learningProgressRes.data || null);

    (teamsRes.data?.teams || []).forEach((t) => {
      const teamId = t.team_id || t._id;
      if (teamId) fetchTeamFiles(teamId);
    });
  } catch (err) {
    console.error(err);
    setError("Failed to load dashboard. Please login again.");
  }
};


  const fetchTeamFiles = async (teamId) => {
    try {
      const res = await axiosInstance.get(`/team-files/${teamId}`);
      setTeamFiles((prev) => ({
        ...prev,
        [teamId]: res.data?.files ?? [],
      }));
    } catch {}
  };

  const uploadFile = async (teamId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading((p) => ({ ...p, [teamId]: true }));
      await axiosInstance.post(`/team-files/upload/${teamId}`, formData);
      fetchTeamFiles(teamId);
    } finally {
      setUploading((p) => ({ ...p, [teamId]: false }));
    }
  };

  /* ================= STAT CARD ================= */
  const StatCard = ({ title, value, to }) => {
    const accents = {
      Skills: "from-indigo-100 to-indigo-50 text-indigo-900",
      "Skill Mapper": "from-sky-100 to-sky-50 text-sky-900",
      Teams: "from-emerald-100 to-emerald-50 text-emerald-900",
      Gamification: "from-amber-100 to-amber-50 text-amber-900",
      "Learning Progress": "from-purple-100 to-purple-50 text-purple-900", // ⭐ NEW
    };

    return (
      <div
        onClick={() => to && navigate(to)}
        className={`
          rounded-2xl p-5 border bg-gradient-to-br
          ${accents[title]}
          cursor-pointer transition-all
          hover:scale-[1.03] hover:shadow-lg
        `}
      >
        <p className="text-xs uppercase tracking-wide opacity-80">
          {title}
        </p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100/40 p-6">
        
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-indigo-900">
            {user?.full_name ? `${user.full_name}'s Dashboard` : "Dashboard"}
          </h1>
          <p className="text-sm text-indigo-600">
            Track your learning journey, skills and teams
          </p>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <StatCard title="Skills" value={stats.skills_count || 0} to="/skill-mapper" />
          <StatCard title="Teams" value={teams.length} to="/team-builder" />
          <StatCard title="Gamification" value={stats.gamification_score || 0} to="/gamification" />

          {/* ⭐ NEW learning progress */}
<StatCard
  title="Learning Progress"
  value={`${learningProgress?.overall_progress ?? 0}%`}
  to="/career-roadmap"
/>

        </div>

       {/* ================= LEARNING PROGRESS BLOCK ================= */}
<section className="mb-12 bg-white rounded-2xl border border-purple-100 p-6">
  <h2 className="text-lg font-semibold text-purple-900 mb-3">
    📚 Learning Progress
  </h2>

{!learningProgress ? (
  <p className="text-slate-500 text-sm">No learning data yet</p>
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
      <span className="font-semibold">
        {" "}
        {learningProgress?.skills_learned || 0}
      </span>
    </p>

    <p>
      Gaps Remaining:
      <span className="font-semibold">
        {" "}
        {learningProgress?.gaps_remaining || 0}
      </span>
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


        {/* ================= SKILLS ================= */}
        <section className="mb-12 bg-white rounded-2xl border border-indigo-100 p-6">
          <h2 className="text-lg font-semibold text-indigo-900 mb-3">
            Skill Distribution
          </h2>

          <div className="flex flex-wrap gap-2">
            {Object.keys(skills).length === 0 ? (
              <p className="text-slate-500 text-sm">No skills added yet</p>
            ) : (
              Object.keys(skills).map((skill) => (
                <span
                  key={skill}
                  className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {skill} ({skills[skill]})
                </span>
              ))
            )}
          </div>
        </section>

        {/* ================= MY TEAMS ================= */}
        <section>
          <h2 className="text-2xl font-semibold text-emerald-900 mb-4">
            My Teams
          </h2>

          {teams.length === 0 ? (
            <p className="text-slate-500">You are not part of any team yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team) => (
                <TeamCard
                  key={team.team_id || team._id}
                  team={team}
                  teamFiles={teamFiles}
                  uploading={uploading}
                  onUploadFile={uploadFile}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default StudentDashboard;  