import React from "react";
import { useNavigate } from "react-router-dom";

const TeamCard = ({ team }) => {
  const teamId = team.team_id || team._id;
  const navigate = useNavigate();
  const skills = team.required_skills || [];
  const members = team.members || [];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">
        {team.team_name || "Untitled team"}
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Mentor: <b>{team.mentor_name || "Unassigned"}</b>
      </p>

      <div className="my-3 flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <span className="text-xs text-slate-500">No required skills listed</span>
        ) : (
          skills.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
            >
              {s}
            </span>
          ))
        )}
      </div>

      <p className="mb-1 text-sm font-semibold">
        Members ({members.length}/{team.team_size || members.length})
      </p>
      <ul className="mb-3 list-disc pl-5 text-sm">
        {members.map((m) => (
          <li key={m.id || m.user_id}>{m.full_name || m.name}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => navigate(`/student/team/${teamId}`)}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-white transition hover:bg-indigo-700"
      >
        Open Team Space
      </button>
    </article>
  );
};

export default TeamCard;
