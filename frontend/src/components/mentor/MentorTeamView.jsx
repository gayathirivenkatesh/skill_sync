import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import RubricView from "../student/RubricView";
import ProjectOverview from "../student/ProjectOverview";

const API = "http://localhost:8000/api";

const MentorTeamView = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { token } = useContext(AuthContext);

  const [team, setTeam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [plagiarism, setPlagiarism] = useState(null);
  const [feedback, setFeedback] = useState("");

  const fetchTeam = async () => {
    try {
      const res = await axios.get(`${API}/mentor/team/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam(res.data.team);
      setSubmission(res.data.submission);
      setPlagiarism(res.data.plagiarism);
    } catch {
      alert("Failed to load team");
    }
  };

  useEffect(() => {
    if (token) fetchTeam();
  }, [teamId, token]);

  const decide = async (status) => {
    try {
      await axios.post(
        `${API}/mentor/review/${teamId}`,
        { status, feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Review submitted");
      fetchTeam();
    } catch {
      alert("Review failed");
    }
  };

  if (!team) {
    return (
      <MainLayout>
        <p className="p-6 text-slate-500">Loading team details…</p>
      </MainLayout>
    );
  }

  const hasSubmission = submission?.files?.length > 0;
  const highRisk = plagiarism?.score >= 70;

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600 hover:text-slate-900 w-fit"
          >
            ← Back to teams
          </button>

          <h2 className="text-2xl font-semibold text-slate-900">
            {team.team_name}
          </h2>

          <p className="text-sm text-slate-600">
            Review status:{" "}
            <span className="font-medium text-slate-800">
              {team.review_status}
            </span>
          </p>
        </div>

        {/* STATUS PANEL */}
        <div
          className={`rounded-xl p-4 border ${
            highRisk
              ? "bg-rose-50 border-rose-200"
              : hasSubmission
              ? "bg-amber-50 border-amber-200"
              : "bg-indigo-50 border-indigo-200"
          }`}
        >
          {highRisk && (
            <p className="text-rose-700 font-medium">
              🚨 High plagiarism detected ({plagiarism.score}%).  
              Please review carefully before taking action.
            </p>
          )}

          {!highRisk && hasSubmission && (
            <p className="text-amber-700 font-medium">
              📄 Submission received. Ready for evaluation.
            </p>
          )}

          {!hasSubmission && (
            <p className="text-indigo-700 font-medium">
              🗓 No submission yet. Consider scheduling a mentoring session.
            </p>
          )}
        </div>

        {/* PROJECT OVERVIEW */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <ProjectOverview
            meta={team.project_meta || {}}
            teamId={team.team_id}
            editable={false}
          />
        </div>

        {/* SUBMISSION FILES */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-slate-800 mb-3">
            Submitted Files
          </h3>

          {hasSubmission ? (
            <ul className="space-y-2">
              {submission.files.map((f) => (
                <li key={f._id || f.url}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {f.filename}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No files submitted yet.</p>
          )}
        </div>

        {/* PLAGIARISM */}
        <div className="text-sm text-slate-700">
          Similarity score:{" "}
          <span className="font-medium">
            {plagiarism?.score ?? 0}%
          </span>{" "}
          ({plagiarism?.status ?? "Not checked"})
        </div>

        {/* RUBRIC & DECISION */}
        {hasSubmission && (
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
            <RubricView
              teamId={teamId}
              rubric={submission?.rubric}
              finalScore={submission?.final_score}
              isMentor
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mentor Feedback
              </label>
              <textarea
                className="
                  w-full rounded-md border border-slate-300
                  px-3 py-2 text-sm text-slate-900
                  focus:ring-2 focus:ring-indigo-400 outline-none
                "
                rows={3}
                placeholder="Write constructive feedback for the team…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => decide("approved")}
                className="
                  bg-emerald-600 text-white
                  px-5 py-2 rounded-md text-sm font-medium
                  hover:bg-emerald-700 transition
                "
              >
                Approve Submission
              </button>

              <button
                onClick={() => decide("rejected")}
                className="
                  bg-rose-600 text-white
                  px-5 py-2 rounded-md text-sm font-medium
                  hover:bg-rose-700 transition
                "
              >
                Reject & Send Back
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MentorTeamView;
