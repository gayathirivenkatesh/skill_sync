import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { AuthContext } from "../../context/AuthContext";

const API = "http://localhost:8000/api";

const MyMentees = () => {
  const { token } = useContext(AuthContext);
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMentees = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API}/mentor/my-mentees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMentees(res.data.mentees || []);
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to fetch mentees");
      } finally {
        setLoading(false);
      }
    };
    fetchMentees();
  }, [token]);

  const openMentee = (menteeId, teamId) => {
    navigate(`/mentor/team/${teamId}`, { state: { menteeId } });
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            My Mentees
          </h2>
          <p className="text-sm mt-1 text-rose-600 dark:text-rose-400">
            Track and guide each mentee with focused attention
          </p>
        </div>

        {/* Error */}
        {!loading && error && (
          <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Skeleton Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && mentees.length === 0 && !error && (
          <div className="bg-white dark:bg-slate-800 p-10 rounded-xl shadow-sm text-center">
            <p className="text-slate-700 dark:text-slate-300 text-lg">
              No mentees assigned yet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Once assigned, your mentees will appear here.
            </p>
          </div>
        )}

        {/* Mentees Grid */}
        {!loading && mentees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentees.map((mentee) => {
              const menteeId = mentee.id || mentee._id;

              return (
                <div
                  key={menteeId}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-lg transition flex flex-col"
                >
                  <div className="p-5 flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {mentee.name}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {mentee.email}
                    </p>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      Team: {mentee.team_name}
                    </p>

                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Submissions: {mentee.submissions_count ?? 0}
                    </p>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                    <button
                      onClick={() =>
                        openMentee(menteeId, mentee.team_id)
                      }
                      className="
                        w-full bg-rose-600 text-white py-2 rounded-md
                        hover:bg-rose-700
                        focus:ring-2 focus:ring-rose-400
                        text-sm transition
                      "
                    >
                      View Mentee Workspace
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MyMentees;
