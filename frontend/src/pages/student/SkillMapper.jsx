import React, { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import axios from "axios";

const SkillAndProjectMatcher = () => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const token = localStorage.getItem("token");

  /* ---------------- Extract skills from text ---------------- */
  const handleTextSubmit = async () => {
    if (!text) return alert("Please enter resume text.");
    try {
      setLoadingSkills(true);
      const res = await axios.post(
        "http://localhost:8000/api/skills/extract_skills",
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSkills(res.data.skills || []);
    } catch (error) {
      alert(error.response?.data?.detail || error.message);
    } finally {
      setLoadingSkills(false);
    }
  };

  /* ---------------- Extract skills from resume file ---------------- */
  const handleFileUpload = async () => {
    if (!file) return alert("Please select a resume file.");
    try {
      setLoadingSkills(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "http://localhost:8000/api/skills/resume-parser",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSkills(res.data.skills || []);
    } catch (error) {
      alert(error.response?.data?.detail || error.message);
    } finally {
      setLoadingSkills(false);
    }
  };

  /* ---------------- Fetch projects ---------------- */
  useEffect(() => {
    if (!skills.length) return;

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await axios.post(
          "http://localhost:8000/api/projects/recommendations",
          { user_skills: skills },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjects(res.data.projects || []);
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [skills]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-sky-100/40 p-6">

        {/* HEADER */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-teal-900">
            Skill & Project Matcher
          </h2>
          <p className="text-sm text-teal-600">
            Explore projects that match your growing skillset
          </p>
        </div>

        {/* SKILL EXTRACTION */}
        <section className="bg-white rounded-2xl border border-teal-100 p-6 mb-10">
          <h3 className="text-lg font-semibold text-teal-900 mb-4">
            Extract Your Skills
          </h3>

          <textarea
            className="w-full p-3 border border-slate-200 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-teal-300 outline-none"
            rows={6}
            placeholder="Paste your resume text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTextSubmit}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700 transition"
            >
              Extract from Text
            </button>

            <label className="border border-teal-300 px-4 py-2 rounded-lg text-sm cursor-pointer text-teal-700 hover:bg-teal-50 transition">
              Upload Resume
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                hidden
              />
            </label>

            <button
              onClick={handleFileUpload}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-sky-700 transition"
            >
              Extract from File
            </button>
          </div>

          {loadingSkills && (
            <p className="text-sm text-teal-600 mt-3">
              Extracting skills…
            </p>
          )}
        </section>

        {/* SKILLS */}
        {skills.length > 0 && (
          <section className="bg-white rounded-2xl border border-sky-100 p-6 mb-10">
            <h3 className="text-lg font-semibold text-sky-900 mb-3">
              Extracted Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* PROJECTS */}
        <section className="bg-white rounded-2xl border border-emerald-100 p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-3">
            Recommended Projects
          </h3>

          {loadingProjects && (
            <p className="text-sm text-emerald-600">
              Finding matching projects…
            </p>
          )}

          {!loadingProjects && projects.length > 0 ? (
            <ul className="space-y-4">
              {projects.map((project, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-slate-200 p-4 hover:bg-emerald-50/40 transition"
                >
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold"
                  >
                    {project.title}
                  </a>
                  <p className="text-sm text-slate-700 mt-1">
                    {project.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Source: {project.source}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            skills.length > 0 &&
            !loadingProjects && (
              <p className="text-sm text-slate-500">
                No projects found yet — keep growing your skills!
              </p>
            )
          )}
        </section>

      </div>
    </MainLayout>
  );
};

export default SkillAndProjectMatcher;
