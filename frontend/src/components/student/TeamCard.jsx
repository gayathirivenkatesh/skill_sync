import React from "react";
import TeamFiles from "./TeamFiles";
import { useNavigate } from "react-router-dom";

const TeamCard = ({
  team,
  teamFiles,
  uploading,
  onUploadFile,
}) => {
  const teamId = team.team_id || team._id;
  const navigate = useNavigate();

  return (
    <div className="border rounded-xl p-5 bg-white shadow">


      <p className="text-sm text-gray-600">
        Mentor: <b>{team.mentor_name}</b>
      </p>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 my-3">
        {team.required_skills.map((s, i) => (
          <span
            key={i}
            className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Members */}
      <p className="text-sm font-semibold mb-1">
        Members ({team.members.length}/{team.team_size})
      </p>
      <ul className="list-disc pl-5 text-sm mb-3">
        {team.members.map((m) => (
          <li key={m.id || m.user_id}>
            {m.full_name || m.name}
          </li>
        ))}
      </ul>

      {/* Chat */}
  <button
    onClick={() => navigate(`/student/team/${teamId}`)}
    className="w-full bg-blue-600 text-white py-2 rounded mb-3 hover:bg-blue-700 transition"
  >
    💬 Open Team Chat
  </button>

      {/* Files */}
      <TeamFiles
  teamId={teamId}
  files={teamFiles?.[teamId] || []}
  uploading={uploading?.[teamId] || false}
  onUpload={onUploadFile}
/>

    </div>
  );
};


export default TeamCard;
