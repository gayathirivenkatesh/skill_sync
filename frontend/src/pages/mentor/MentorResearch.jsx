import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPlus, FiBookOpen, FiTrash2 } from "react-icons/fi";
import MainLayout from "../../layouts/MainLayout";

const API = "http://localhost:8000/api/mentor/research";

const MentorResearch = () => {
  const token = localStorage.getItem("token");

  const [researchItems, setResearchItems] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);

  const axiosInstance = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  // FETCH ITEMS
  const fetchResearch = async () => {
    if (!token) return;

    try {
      const res = await axiosInstance.get("/");
      setResearchItems(res.data.items || []);
    } catch {
      setResearchItems([]);
    }
  };

  useEffect(() => {
    fetchResearch();
  }, [token]);

  // ADD ITEM
  const addResearch = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    setLoading(true);

    try {
      const res = await axiosInstance.post("/add", {
        title: newTitle,
        content: newContent,
      });

      setResearchItems([res.data, ...researchItems]);
      setNewTitle("");
      setNewContent("");
    } catch {
      alert("Failed to add research item");
    }

    setLoading(false);
  };

  // DELETE ITEM (BY ID)
  const deleteResearch = async (id) => {
    if (!window.confirm("Delete this insight?")) return;

    try {
      await axiosInstance.delete(`/delete/${id}`);

      setResearchItems(researchItems.filter(i => i.id !== id));
    } catch {
      alert("Failed to delete insight");
    }
  };

  const formatDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
};


  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto p-6">

          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FiBookOpen className="text-teal-600" />
              Research & Insights
            </h1>
            <p className="text-sm mt-1 text-teal-700/80 dark:text-teal-300">
              Capture insights and learning patterns to guide your mentees
            </p>
          </div>

          {/* CREATE NEW */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Create New Insight
            </h3>

            <div className="space-y-4">
              <input
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                placeholder="Insight title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <textarea
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-400 outline-none"
                placeholder="Write your research, insight, or observation..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
              />

              <button
                onClick={addResearch}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-md hover:bg-teal-700 focus:ring-2 focus:ring-teal-400 transition text-sm"
              >
                <FiPlus />
                {loading ? "Adding..." : "Add Insight"}
              </button>
            </div>
          </div>

          {/* LIST */}
          {researchItems.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400">
              No insights added yet.
            </div>
          ) : (
            <div className="space-y-6">
              {researchItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition p-6 relative"
                >

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => deleteResearch(item.id)}
                    className="absolute top-3 right-3 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>

                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>

                  <span className="text-xs text-slate-400 mt-4 block">
                    {item.display_time || formatDate(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MentorResearch;
