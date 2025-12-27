import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import MainLayout from "../../layouts/MainLayout";
import MentorActionPanel from "../../components/mentor/MentorActionPanel";
import SessionScheduler from "../../components/mentor/SessionScheduler";

const API = "http://localhost:8000/api";

// Status styles for badges
const statusStyles = {
  approved: "bg-emerald-900/40 text-emerald-300",
  rejected: "bg-rose-900/40 text-rose-300",
  pending: "bg-amber-900/40 text-amber-300",
};

const MentorMyTeams = () => {
  const { token } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSessionTeam, setActiveSessionTeam] = useState(null);
  const navigate = useNavigate();

  // Fetch mentor's teams
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/mentor/my-teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(res.data.teams || []);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  // Fetch mentor's sessions
  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/mentor/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Ensure we get an array
      setSessions(Array.isArray(res.data.sessions) ? res.data.sessions : []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setSessions([]); // fallback
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchSessions();
  }, [token]);

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            My Teams
          </h2>
          <p className="text-sm mt-1 text-amber-600 dark:text-amber-400">
            Teams you guide, review, and help grow
          </p>
        </div>

        {/* Error Message */}
        {!loading && error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Upcoming Sessions */}
        {!loading && sessions.length > 0 && (
          <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Upcoming Sessions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((s) => {
                const team =
                  teams.find(
                    (t) => t._id === s.team_id || t.id === s.team_id || t.team_id === s.team_id
                  ) || {};
                return (
                  <div
                    key={s.id}
                    className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 flex flex-col gap-2 shadow-sm"
                  >
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Team: {team.team_name || "Unknown Team"}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {new Date(s.datetime).toLocaleString()}
                    </span>
                    {s.link && (
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        Join Session
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State for Teams */}
        {!loading && teams.length === 0 && !error && (
          <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-sm text-center">
            <p className="text-slate-700 dark:text-slate-300 text-lg">
              No teams assigned yet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              You’ll see teams here once they’re mapped to you.
            </p>
          </div>
        )}

        {/* Teams Grid */}
        {!loading && teams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const teamId = team._id || team.id || team.team_id;
              const status = team.review_status || "pending";
              const badgeStyle = statusStyles[status] || statusStyles.pending;

              return (
                <div
                  key={teamId}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {team.team_name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyle}`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Members: {team.members?.length ?? 0}
                    </p>

                    <MentorActionPanel teamId={teamId} />
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/mentor/team/${teamId}`)}
                      className="
                        w-full bg-amber-600 text-white py-2 rounded-md
                        hover:bg-amber-700
                        focus:ring-2 focus:ring-amber-400
                        text-sm transition
                      "
                    >
                      Open Team Workspace
                    </button>

                    <button
                      onClick={() => setActiveSessionTeam(teamId)}
                      className="
                        w-full bg-slate-700 text-slate-200 py-2 rounded-md
                        hover:bg-slate-600
                        text-sm transition
                      "
                    >
                      Schedule Session
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Session Scheduler Modal */}
        {activeSessionTeam && (
          <SessionScheduler
            teamId={activeSessionTeam}
            token={token}
            onClose={() => setActiveSessionTeam(null)}
            onScheduled={() => {
              fetchTeams();
              fetchSessions(); // refresh sessions after scheduling
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default MentorMyTeams;
