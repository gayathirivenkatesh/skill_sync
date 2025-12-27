import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";

const TeamBuilder = () => {
  const { user, token, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [mode, setMode] = useState("my");
  const [myTeams, setMyTeams] = useState([]);
  const [joinTeams, setJoinTeams] = useState([]);
  const [mentors, setMentors] = useState([]);

  const [teamName, setTeamName] = useState("");
  const [skills, setSkills] = useState("");
  const [teamSize, setTeamSize] = useState(3);
  const [mentorId, setMentorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ================= FETCH MENTORS ================= */
  useEffect(() => {
    if (mode !== "create" || !token) return;

    axios
      .get(`${API_BASE}/team/mentors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setMentors(res.data.mentors || []))
      .catch(() => setMentors([]));
  }, [mode, token]);

  /* ================= FETCH MY TEAMS ================= */
  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API_BASE}/team/my-teams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setMyTeams(res.data.teams || []))
      .catch(() => setMyTeams([]));
  }, [token]);

  /* ================= FETCH JOINABLE TEAMS ================= */
  useEffect(() => {
    if (!token || mode !== "join") return;

    axios
      .get(`${API_BASE}/team/existing-teams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setJoinTeams(res.data.teams || []))
      .catch(() => setJoinTeams([]));
  }, [token, mode]);

  /* ================= CREATE TEAM ================= */
  const createTeam = async () => {
    if (!teamName || !skills || !mentorId) {
      alert("Fill all fields");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        `${API_BASE}/team/build-team`,
        {
          team_name: teamName,
          team_size: Number(teamSize),
          required_skills: skills.split(",").map(s => s.trim()),
          mentor_id: mentorId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Team created successfully");
      setMode("my");

      const res = await axios.get(`${API_BASE}/team/my-teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyTeams(res.data.teams || []);
    } catch {
      alert("Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= JOIN TEAM ================= */
  const joinTeam = async teamId => {
    try {
      await axios.post(
        `${API_BASE}/team/join/${teamId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Joined team");
      setMode("my");

      const res = await axios.get(`${API_BASE}/team/my-teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyTeams(res.data.teams || []);
    } catch {
      alert("Join failed");
    }
  };

  if (loading) return null;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100/40 p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-900">
            Team Builder
          </h1>
          <p className="text-sm text-amber-600">
            Build, join, and collaborate with your team
          </p>
        </div>

        {/* TABS */}
        <div className="flex gap-3 mb-8">
          {["create", "my", "join"].map(tab => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === tab
                  ? "bg-amber-600 text-white shadow"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              {tab === "create"
                ? "Build Team"
                : tab === "my"
                ? "My Teams"
                : "Join Team"}
            </button>
          ))}
        </div>

        {/* CREATE TEAM */}
        {mode === "create" && (
          <section className="bg-white rounded-2xl border border-amber-100 p-6 max-w-xl">
            <input
              className="w-full border rounded-lg p-3 mb-3 text-sm"
              placeholder="Team Name"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
            />

            <input
              className="w-full border rounded-lg p-3 mb-3 text-sm"
              placeholder="Skills (comma separated)"
              value={skills}
              onChange={e => setSkills(e.target.value)}
            />

            <select
              className="w-full border rounded-lg p-3 mb-3 text-sm"
              value={teamSize}
              onChange={e => setTeamSize(+e.target.value)}
            >
              {[2, 3, 4, 5, 6].map(s => (
                <option key={s} value={s}>Team size: {s}</option>
              ))}
            </select>

            <select
              className="w-full border rounded-lg p-3 mb-4 text-sm"
              value={mentorId}
              onChange={e => setMentorId(e.target.value)}
            >
              <option value="">Select mentor</option>
              {mentors.map(m => (
                <option key={m.id} value={m.id} disabled={m.slotsLeft === 0}>
                  {m.full_name} {m.slotsLeft === 0 ? "(Full)" : `(Slots: ${m.slotsLeft})`}
                </option>
              ))}
            </select>

            <button
              onClick={createTeam}
              disabled={submitting}
              className="bg-amber-600 text-white px-5 py-2 rounded-lg hover:bg-amber-700 transition"
            >
              {submitting ? "Creating..." : "Create Team"}
            </button>
          </section>
        )}

        {/* MY TEAMS */}
        {mode === "my" && (
          <section className="space-y-4">
            {myTeams.length === 0 ? (
              <p className="text-slate-500">You are not part of any team yet.</p>
            ) : (
              myTeams.map(t => (
                <div
                  key={t.team_id}
                  className="bg-white border border-amber-100 rounded-xl p-5"
                >
                  <p className="font-semibold text-amber-900">
                    {t.team_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Status: {t.review_status}
                  </p>

                  <button
                    onClick={() => navigate(`/student/team/${t.team_id}`)}
                    className="mt-3 bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-900"
                  >
                    Open Team Space
                  </button>
                </div>
              ))
            )}
          </section>
        )}

        {/* JOIN TEAM */}
        {mode === "join" && (
          <section className="space-y-4 max-w-2xl">
            {joinTeams.length === 0 ? (
              <p className="text-slate-500">No teams available to join.</p>
            ) : (
              joinTeams.map(t => (
                <div
                  key={t.team_id}
                  className="bg-white border border-amber-100 rounded-xl p-5"
                >
                  <p className="font-semibold text-amber-900">
                    {t.team_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    Mentor: {t.mentor_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    Members {t.members.length}/{t.team_size}
                  </p>

                  <button
                    onClick={() => joinTeam(t.team_id)}
                    className="mt-3 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-emerald-700"
                  >
                    Join Team
                  </button>
                </div>
              ))
            )}
          </section>
        )}

      </div>
    </MainLayout>
  );
};

export default TeamBuilder;
