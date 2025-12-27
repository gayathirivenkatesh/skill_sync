import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import TeamChat from "../../components/chat/TeamChat";
import TeamFiles from "../../components/student/TeamFiles";
import RubricView from "../../components/student/RubricView";
import PeerAppreciation from "../../components/student/PeerAppreciation";
import PlagiarismStatus from "../../components/student/PlagiarismStatus";
import ProjectOverview from "../../components/student/ProjectOverview";

const API_BASE = "http://localhost:8000/api";

/* ================= TEAM SPACE THEME ================= */
const teamTheme = {
  page: "bg-gradient-to-br from-amber-50 via-orange-50/40 to-emerald-50",
  card: "bg-white border border-amber-200",
  heading: "text-slate-800",
  subText: "text-slate-600",
  badge: "bg-amber-100 text-amber-800",
  sectionTitle: "text-slate-700",
  backBtn: "bg-slate-700 hover:bg-slate-800 text-white",
  sessionBox: "bg-emerald-50 border border-emerald-200",
  submitBox: "bg-amber-100 border border-amber-300",
  submitBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
};

const TeamSpace = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user, token, loading } = useContext(AuthContext);

  const [team, setTeam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [files, setFiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const fetchTeamData = async () => {
    try {
      const [teamRes, filesRes] = await Promise.all([
        axios.get(`${API_BASE}/team/details/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/team-files/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTeam(teamRes.data.team);
      setSubmission(teamRes.data.submission || null);
      setFiles(filesRes.data.files || []);

      try {
        const sessRes = await axios.get(`${API_BASE}/team/sessions/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessions(sessRes.data || []);
      } catch {
        setSessions([]);
      }
    } catch {
      alert("Failed to load team data");
      navigate("/team-builder");
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (token && teamId) fetchTeamData();
  }, [teamId, token]);

  const submitForReview = async () => {
    if (files.length === 0) return alert("Upload files first!");
    try {
      await axios.post(
        `${API_BASE}/team/submit-review/${teamId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Submitted successfully!");
      fetchTeamData();
    } catch (err) {
      alert(err?.response?.data?.detail || "Submission failed");
    }
  };

  if (loading || loadingTeam || !user) {
    return (
      <MainLayout>
        <p className="p-6 text-slate-500">Loading team space…</p>
      </MainLayout>
    );
  }

  if (!team) {
    return (
      <MainLayout>
        <p className="p-6 text-slate-500">Team not found.</p>
      </MainLayout>
    );
  }

  const isCreator = String(team.creator_id) === String(user.id);
  const isMentor = user.role === "mentor";
  const isLocked = ["submitted", "approved"].includes(team.review_status);
  const editable = isCreator && !isLocked;

  return (
    <MainLayout>
      <div className={`p-6 rounded-2xl ${teamTheme.page}`}>

        {/* HEADER */}
        <div className={`p-5 rounded-xl mb-6 ${teamTheme.card}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-2xl font-semibold ${teamTheme.heading}`}>
                {team.team_name}
              </h2>
              <p className={teamTheme.subText}>
                Mentor: <b>{team.mentor_name}</b>
              </p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm ${teamTheme.badge}`}>
                Status: {team.review_status}
              </span>
            </div>

            <button
              onClick={() => navigate("/team-builder")}
              className={`px-4 py-2 rounded-lg ${teamTheme.backBtn}`}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* PROJECT OVERVIEW */}
        <ProjectOverview
          meta={team.project_meta || {}}
          teamId={team.id}
          editable={editable}
        />

        {/* CHAT */}
        <TeamChat teamId={teamId} />

        {/* FILES */}
        <TeamFiles
          teamId={teamId}
          isLocked={isLocked}
          userId={user.id}
          isCreator={isCreator}
          onFilesUpdate={setFiles}
        />

        {/* PLAGIARISM */}
        <PlagiarismStatus teamId={teamId} />

        {/* RUBRIC */}
        <RubricView
          teamId={teamId}
          rubric={submission?.rubric}
          finalScore={submission?.final_score}
          isMentor={isMentor}
        />

        {/* SESSIONS */}
        {sessions.length > 0 && (
          <div className={`mt-6 p-6 rounded-2xl ${teamTheme.sessionBox}`}>
            <h3 className={`font-semibold mb-4 text-lg ${teamTheme.sectionTitle}`}>
              📅 Scheduled Sessions
            </h3>

            <div className="space-y-3">
              {sessions.map((s) => {
                const date = new Date(s.datetime);

                return (
                  <div
                    key={s._id}
                    className="flex items-center justify-between p-4 rounded-xl
                    bg-white/70 backdrop-blur border shadow-sm hover:shadow-md transition"
                  >
                    {/* Date & Time */}
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center
                        w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 font-semibold">
                        <span className="text-xs uppercase">
                          {date.toLocaleString("en-US", { month: "short" })}
                        </span>
                        <span className="text-lg leading-none">
                          {date.getDate()}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          Status: {s.status}
                        </p>
                      </div>
                    </div>

                    {/* Join CTA */}
                    {s.link ? (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-lg text-sm font-medium
                        bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      >
                        Join Session →
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Link not available
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBMIT */}
        {isCreator && !isLocked && (
          <div className={`my-6 p-5 rounded-xl ${teamTheme.submitBox}`}>
            <p className="text-sm text-slate-700 mb-3">
              Make sure all required files are uploaded before submission.
            </p>
            <button
              disabled={files.length === 0}
              onClick={submitForReview}
              className={`px-5 py-2 rounded-lg ${
                files.length === 0
                  ? "bg-slate-400 cursor-not-allowed text-white"
                  : teamTheme.submitBtn
              }`}
            >
              Submit Project for Review
            </button>
          </div>
        )}

        {/* PEER EVALUATION */}
        <PeerAppreciation
  teamId={teamId}          // ✅ safest
  teamMembers={team.members || []}
        />


      </div>
    </MainLayout>
  );
};

export default TeamSpace;
