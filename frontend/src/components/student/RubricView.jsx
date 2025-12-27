import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { CheckCircle } from "lucide-react";

const API = "http://localhost:8000/api";

/* ================= RUBRIC DEFINITIONS ================= */
const RUBRIC_FIELDS = {
  problem: {
    label: "Problem Understanding",
    hint: "Clarity of problem comprehension & requirements",
  },
  implementation: {
    label: "Implementation Quality",
    hint: "Code quality, correctness, and technical depth",
  },
  teamwork: {
    label: "Team Collaboration",
    hint: "Communication, contribution, and coordination",
  },
  presentation: {
    label: "Presentation & Documentation",
    hint: "Explanation, structure, and clarity",
  },
};

const RubricView = ({
  teamId,
  rubric: initialRubric,
  finalScore,
  isMentor = false,
}) => {
  const { token } = useContext(AuthContext);

  const [rubric, setRubric] = useState({
    problem: 0,
    implementation: 0,
    teamwork: 0,
    presentation: 0,
  });

  const [saving, setSaving] = useState(false);
  const totalScore = Object.values(rubric).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (initialRubric) setRubric(initialRubric);
  }, [initialRubric]);

  const updateScore = (key, value) => {
    setRubric({ ...rubric, [key]: Number(value) });
  };

  const submitRubric = async () => {
    setSaving(true);
    try {
      const res = await axios.post(
        `${API}/team/rubric/${teamId}`,
        rubric,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Final Score Saved: ${res.data.final_score}/40`);
    } catch {
      alert("Failed to save rubric");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-stone-200 bg-white shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800">
          Evaluation Rubric
        </h3>
        <p className="text-xs text-slate-500">
          Transparent, fair assessment across key dimensions
        </p>
      </div>

      {/* Rubric Fields */}
      <div className="space-y-5">
        {Object.entries(RUBRIC_FIELDS).map(([key, meta]) => (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {meta.label}
                </p>
                <p className="text-xs text-slate-500">{meta.hint}</p>
              </div>
              <span className="text-sm font-semibold text-amber-700">
                {rubric[key]} / 10
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={rubric[key]}
              disabled={!isMentor}
              onChange={(e) => updateScore(key, e.target.value)}
              className={`w-full accent-amber-600 ${
                !isMentor ? "cursor-not-allowed opacity-70" : ""
              }`}
            />
          </div>
        ))}
      </div>

      {/* Total Score */}
      <div className="mt-6 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div>
          <p className="text-sm text-amber-800 font-medium">
            Total Score
          </p>
          <p className="text-xs text-amber-700">
            Out of 40 points
          </p>
        </div>
        <p className="text-2xl font-bold text-amber-900">
          {isMentor ? totalScore : finalScore ?? totalScore}
        </p>
      </div>

      {/* Mentor Save */}
      {isMentor && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={submitRubric}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium shadow
              ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
          >
            <CheckCircle size={16} />
            {saving ? "Saving..." : "Save Evaluation"}
          </button>
        </div>
      )}
    </div>
  );
};

export default RubricView;
