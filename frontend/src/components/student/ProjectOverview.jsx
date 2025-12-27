import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { Github, Globe, Save } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-600">{label}</label>
    {children}
  </div>
);

const ProjectOverview = ({ meta = {}, editable, teamId }) => {
  const { token } = useContext(AuthContext);

  const [form, setForm] = useState({
    title: meta.title || "",
    problem: meta.problem_statement || "",
    solution: meta.solution_summary || "",
    techStack: meta.tech_stack?.join(", ") || "",
    github: meta.github_repo || "",
    demo: meta.live_url || "",
  });

  const [saving, setSaving] = useState(false);

  const saveDetails = async () => {
    if (!form.title || !form.problem || !form.solution || !form.techStack) {
      alert("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API_BASE}/team/project-meta/${teamId}`,
        {
          title: form.title,
          problem_statement: form.problem,
          solution_summary: form.solution,
          tech_stack: form.techStack.split(",").map((t) => t.trim()),
          github_repo: form.github,
          live_url: form.demo,
          last_updated: new Date(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Project details saved");
      window.location.reload();
    } catch {
      alert("Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  /* ================= READ VIEW ================= */

  if (!editable) {
    return (
      <div className="mb-8 rounded-2xl border border-stone-200 bg-white shadow-sm p-6 space-y-5">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">
            {meta.title || "Untitled Project"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Project Overview</p>
        </div>

        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            <span className="font-semibold text-slate-800">Problem:</span>{" "}
            {meta.problem_statement}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Solution:</span>{" "}
            {meta.solution_summary}
          </p>
          <p>
            <span className="font-semibold text-slate-800">Tech Stack:</span>{" "}
            {meta.tech_stack?.join(", ")}
          </p>
        </div>

        {(meta.github_repo || meta.live_url) && (
          <div className="flex gap-4 pt-3 border-t">
            {meta.github_repo && (
              <a
                href={meta.github_repo}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-700 hover:underline"
              >
                <Github size={16} /> GitHub Repository
              </a>
            )}
            {meta.live_url && (
              <a
                href={meta.live_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-700 hover:underline"
              >
                <Globe size={16} /> Live Demo
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ================= EDIT VIEW ================= */

  return (
    <div className="mb-8 rounded-2xl border border-stone-200 bg-gradient-to-br from-amber-50 to-emerald-50 shadow p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-800">
          Edit Project Overview
        </h3>
        <p className="text-xs text-slate-500">
          This will be visible to mentors during review
        </p>
      </div>

      <Field label="Project Title *">
        <input
          className="w-full rounded-lg border border-stone-300 p-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </Field>

      <Field label="Problem Statement *">
        <textarea
          rows={3}
          className="w-full rounded-lg border border-stone-300 p-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          value={form.problem}
          onChange={(e) => setForm({ ...form, problem: e.target.value })}
        />
      </Field>

      <Field label="Solution Summary *">
        <textarea
          rows={3}
          className="w-full rounded-lg border border-stone-300 p-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          value={form.solution}
          onChange={(e) => setForm({ ...form, solution: e.target.value })}
        />
      </Field>

      <Field label="Tech Stack *">
        <input
          className="w-full rounded-lg border border-stone-300 p-2 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
          placeholder="React, FastAPI, MongoDB"
          value={form.techStack}
          onChange={(e) => setForm({ ...form, techStack: e.target.value })}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="GitHub Repository">
          <input
            className="w-full rounded-lg border border-stone-300 p-2 text-sm"
            value={form.github}
            onChange={(e) => setForm({ ...form, github: e.target.value })}
          />
        </Field>

        <Field label="Live Demo URL">
          <input
            className="w-full rounded-lg border border-stone-300 p-2 text-sm"
            value={form.demo}
            onChange={(e) => setForm({ ...form, demo: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={saveDetails}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700
          text-white px-5 py-2 rounded-xl text-sm font-medium shadow"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default ProjectOverview;
