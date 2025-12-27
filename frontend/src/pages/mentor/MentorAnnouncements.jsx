import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiBell, FiPlus, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import MainLayout from "../../layouts/MainLayout";

const API = "http://localhost:8000/api/mentor/announcements";

const MentorAnnouncements = () => {
  const token = localStorage.getItem("token");

  const [announcements, setAnnouncements] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentContent, setCommentContent] = useState({});

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // ---------- Time formatting ----------
  const formatIST = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  // ---------- Fetch ----------
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(API, authHeader);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    if (token) fetchAnnouncements();
  }, [token]);

  // ---------- Add announcement ----------
  const addAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/add`,
        { title: newTitle, content: newContent },
        authHeader
      );

      setAnnouncements([res.data, ...announcements]);
      setNewTitle("");
      setNewContent("");
    } catch {
      alert("Failed to add");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Delete announcement ----------
  const deleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;

    await axios.delete(`${API}/delete/${id}`, authHeader);

    setAnnouncements(announcements.filter((a) => a._id !== id));
  };

  // ---------- Add comment ----------
  const addComment = async (announcementId) => {
    const content = commentContent[announcementId];
    if (!content?.trim()) return;

    const res = await axios.post(
      `${API}/comment`,
      { announcement_id: announcementId, content },
      authHeader
    );

    setAnnouncements(
      announcements.map((a) =>
        a._id === announcementId
          ? { ...a, comments: [...(a.comments || []), res.data] }
          : a
      )
    );

    setCommentContent({ ...commentContent, [announcementId]: "" });
  };

  // ---------- Delete comment ----------
  const deleteComment = async (announcementId, commentId) => {
    await axios.delete(
      `${API}/comment/${announcementId}/${commentId}`,
      authHeader
    );

    setAnnouncements(
      announcements.map((a) =>
        a._id === announcementId
          ? {
              ...a,
              comments: a.comments.filter((c) => c.comment_id !== commentId),
            }
          : a
      )
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto p-6">

          {/* Header */}
          <h1 className="text-3xl font-bold flex items-center gap-2 text-orange-900 dark:text-orange-200 mb-2">
            <FiBell />
            Mentor Announcements
          </h1>

          {/* New Announcement */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Post New Announcement
            </h3>

            <input
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 mb-3"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <textarea
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              placeholder="Write clearly..."
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />

            <button
              onClick={addAnnouncement}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg"
            >
              <FiPlus />
              {loading ? "Posting..." : "Publish"}
            </button>
          </div>

          {/* List */}
          {announcements.map((a,idx) => (
            <div key={a._id || a.created_at || idx}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-8"
            >
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {a.title}
                </h3>

                {a.is_owner && (
                  <button
                    onClick={() => deleteAnnouncement(a._id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <p className="mt-2 text-slate-700 dark:text-slate-300">
                {a.content}
              </p>

              <span className="block mt-1 text-xs text-slate-500">
                {formatIST(a.created_at)}
              </span>

              {/* Comments */}
              {(a.comments || []).map((c, i) => (
                <div key={c.comment_id || c.created_at || `${a._id}-c-${i}`}
                  className="mt-3 bg-orange-50 dark:bg-slate-900 rounded-lg p-3"
                >
                  <div className="flex justify-between">
                    <p className="text-sm text-slate-800 dark:text-slate-200">
                      <strong>{c.user_name}</strong> — {c.content}
                    </p>

                    {c.is_owner && (
                      <button
                        onClick={() =>
                          deleteComment(a._id, c.comment_id)
                        }
                        className="text-red-500 hover:text-red-600 text-xs"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

                  <span className="text-xs text-slate-500">
                    {formatIST(c.created_at)}
                  </span>
                </div>
              ))}

              {/* Add comment */}
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="Add a reply..."
                  value={commentContent[a._id] || ""}
                  onChange={(e) =>
                    setCommentContent({
                      ...commentContent,
                      [a._id]: e.target.value,
                    })
                  }
                />

                <button
                  onClick={() => addComment(a._id)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-lg"
                >
                  <FiMessageCircle />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default MentorAnnouncements;
