import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiUsers, FiPlus, FiMessageCircle, FiTrash2 } from "react-icons/fi";
import MainLayout from "../../layouts/MainLayout";
import { format } from "date-fns";

const API = "http://localhost:8000/api/mentor/collaboration";

const MentorCollaboration = () => {
  const token = localStorage.getItem("token");

  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentContent, setCommentContent] = useState({});

  const [currentUserId, setCurrentUserId] = useState("");

  // -------- get user id from token --------
  useEffect(() => {
    if (!token) return;

    const payload = JSON.parse(atob(token.split(".")[1]));
    setCurrentUserId(payload.user_id || payload._id || payload.id);
  }, [token]);

  // ---------- Date ----------
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "dd MMM yy • hh:mm a");
  };

  // ---------- Fetch ----------
  const fetchPosts = async () => {
    if (!token) return;
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.posts || []);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  // ---------- Add Post ----------
  const addPost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/add`,
        { title: newTitle, content: newContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts([res.data, ...posts]);
      setNewTitle("");
      setNewContent("");
    } catch {
      alert("Failed to post");
    }
    setLoading(false);
  };

  // ---------- Delete Post ----------
  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await axios.delete(`${API}/delete/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts(posts.filter((p) => p._id !== postId));
    } catch {
      alert("Failed to delete post");
    }
  };

  // ---------- Add Comment ----------
  const addComment = async (postId) => {
    if (!commentContent[postId]?.trim()) return;
    try {
      const res = await axios.post(
        `${API}/comment`,
        { post_id: postId, content: commentContent[postId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(
        posts.map((p) =>
          p._id === postId
            ? { ...p, comments: [...(p.comments || []), res.data] }
            : p
        )
      );

      setCommentContent({ ...commentContent, [postId]: "" });
    } catch {
      alert("Failed to comment");
    }
  };

  // ---------- Delete Comment ----------
  const deleteComment = async (postId, commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await axios.delete(`${API}/comment/delete/${postId}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts(
        posts.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: p.comments.filter((c) => c.id !== commentId),
              }
            : p
        )
      );
    } catch {
      alert("Failed to delete comment");
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-amber-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto p-6">
          <div className="mb-10">
            <h1 className="text-3xl font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <FiUsers />
              Mentor Collaboration
            </h1>
            <p className="text-amber-800 dark:text-slate-400 text-sm mt-1">
              Open conversations, shared wisdom, collective mentoring
            </p>
          </div>

          {/* New Post */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-12 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
              Start a Conversation
            </h3>

            <div className="space-y-4">
              <input
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 
                bg-white dark:bg-slate-900 px-3 py-2"
                placeholder="Discussion title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <textarea
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 
                bg-white dark:bg-slate-900 px-3 py-2"
                placeholder="Share your thoughts..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
              />

              <button
                onClick={addPost}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm"
              >
                <FiPlus />
                {loading ? "Posting..." : "Post Discussion"}
              </button>
            </div>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400">
              No discussions yet.
            </p>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <div key={post._id} className="bg-white dark:bg-slate-8 00 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-semibold">
                      {post.title}
                    </h3>

                    {/* delete own post */}
                    {post.user_id === currentUserId && (
                      <button
                        onClick={() => deletePost(post._id)}
                        className="text-red-500"
                        title="Delete post"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>

                  <p className="mt-2">{post.content}</p>

                  <span className="block mt-3 text-xs text-slate-500">
                    {formatDate(post.created_at)}
                  </span>

                  {/* comments */}
                  <div className="mt-5 space-y-3">
                    {(post.comments || []).map((c) => (
                      <div
                        key={c._id}
                        className="rounded-lg p-3
                        bg-amber-50
                        dark:bg-slate-800
                        text-slate-800
                        dark:text-slate-100"
                      >
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold">{c.user_name}</span>{" "}
                            {c.content}
                          </p>
                          <span className="text-xs text-slate-500">
                            {formatDate(c.created_at)}
                          </span>
                        </div>

                        {/* delete own comment */}
                        {c.user_id === currentUserId && (
                          <button
                            onClick={() => deleteComment(post._id, c.id)}
                            className="text-red-500"
                            title="Delete comment"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add comment */}
                  <div className="mt-4 flex gap-2">
                    <input
                      className="flex-1 rounded-lg border px-3 py-2"
                      placeholder="Write a reply..."
                      value={commentContent[post._id] || ""}
                      onChange={(e) =>
                        setCommentContent({
                          ...commentContent,
                          [post._id]: e.target.value,
                        })
                      }
                    />

                    <button
                      onClick={() => addComment(post._id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-lg"
                    >
                      <FiMessageCircle />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MentorCollaboration;
