import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { API_BASE_URL } from "../../api/apiConfig";


/* ================= SKILL GAP THEME ================= */
const theme = {
  page: "bg-gradient-to-br from-amber-50 via-emerald-50/40 to-sage-50/30",
  card: "bg-white border border-amber-200",
  heading: "text-amber-900",
  subHeading: "text-amber-800",
  text: "text-slate-700",
  muted: "text-slate-500",

  skillTag: "bg-emerald-100 text-emerald-800",
  missingTag: "bg-amber-100 text-amber-800",

  linkGoogle: "text-amber-700 hover:underline",
  linkYoutube: "text-rose-600 hover:underline",

  actionBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
};

const MySkillGaps = () => {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});

  useEffect(() => {
    const fetchSkillGaps = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/learning/my-skill-gaps`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to fetch skill gaps");
      } finally {
        setLoading(false);
      }
    };

    fetchSkillGaps();
  }, [token]);

  const toggleSkill = (skill_name) => {
    setExpandedSkills((prev) => ({
      ...prev,
      [skill_name]: !prev[skill_name],
    }));
  };

  const markAsLearned = (skill_name) => {
    setData((prev) => ({
      ...prev,
      missing_skills: prev.missing_skills.filter(
        (s) => s.skill_name !== skill_name
      ),
      current_skills: [...prev.current_skills, skill_name],
    }));
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-amber-700">
        ⏳ Analyzing your skill gaps…
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center mt-10">{error}</p>;
  }

  const { current_skills = [], missing_skills = [] } = data || {};

  return (
    <>
      <div className={`rounded-2xl p-4 sm:p-6 ${theme.page}`}>

        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className={`text-3xl font-bold ${theme.heading}`}>
            🌱 My Skill Gaps
          </h1>
          <p className={`text-sm mt-1 ${theme.muted}`}>
            Understand what to learn next and close gaps at your own pace
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-10">

          {/* Current Skills */}
          <section className={`p-6 rounded-xl ${theme.card}`}>
            <h2 className={`text-lg font-semibold mb-3 ${theme.subHeading}`}>
              Current Skills
            </h2>

            {current_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {current_skills.map((skill) => (
                  <span
                    key={skill}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${theme.skillTag}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className={theme.muted}>No skills recorded yet.</p>
            )}
          </section>

          {/* Missing Skills */}
          <section>
            <h2 className={`text-lg font-semibold mb-4 ${theme.subHeading}`}>
              Skills to Improve
            </h2>

            {missing_skills.length > 0 ? (
              <div className="space-y-4">
                {missing_skills.map(({ skill_name, learning_resources }) => {
                  const isExpanded = expandedSkills[skill_name];

                  return (
                    <div
                      key={skill_name}
                      className={`p-5 rounded-xl shadow-sm transition ${theme.card}`}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left"
                        onClick={() => toggleSkill(skill_name)}
                        aria-expanded={isExpanded}
                      >
                        <h3 className="font-medium text-slate-800">
                          {skill_name}
                        </h3>
                        <span className="text-slate-500" aria-hidden="true">
                          {isExpanded ? "−" : "+"}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {learning_resources ? (
                            <div className="flex gap-6 text-sm">
                              <a
                                href={learning_resources.google}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={theme.linkGoogle}
                              >
                                Google Resources →
                              </a>
                              <a
                                href={learning_resources.youtube}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={theme.linkYoutube}
                              >
                                YouTube Videos →
                              </a>
                            </div>
                          ) : (
                            <p className={theme.muted}>
                              No learning resources available.
                            </p>
                          )}

                          <button
                            onClick={() => markAsLearned(skill_name)}
                            className={`px-4 py-1.5 rounded-md text-sm transition ${theme.actionBtn}`}
                          >
                            Mark as Learned
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={theme.muted}>
                🎉 You have no missing skills right now!
              </p>
            )}
          </section>

        </div>
      </div>
    </>
  );
};

export default MySkillGaps;
