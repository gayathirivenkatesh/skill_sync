import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";

const API = "http://localhost:8000/api";

/* ============== SHARED COMMUNITY THEME ============== */
const communityTheme = {
  page: "bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50",
  card: "bg-white border border-stone-200",
  heading: "text-slate-800",
  subText: "text-slate-600",
  textarea:
    "border-stone-300 bg-white text-slate-800 placeholder-stone-400 focus:ring-emerald-400",
  primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  secondaryBtn:
    "border border-stone-300 text-slate-600 hover:bg-stone-100",
  badge: "bg-stone-100 text-stone-600",
  replyBox: "border-l border-stone-300",
};

const Community = () => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [reply, setReply] = useState({});
  const [aiLoading, setAiLoading] = useState(false);

  const loadPosts = async () => {
    const res = await axios.get(`${API}/community/posts`, { headers });
    setPosts(res.data || []);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const createPost = async () => {
    if (!content.trim()) return;
    await axios.post(`${API}/community/post`, { content }, { headers });
    setContent("");
    loadPosts();
  };

  const like = async (id) => {
    await axios.post(`${API}/community/like/${id}`, {}, { headers });
    loadPosts();
  };

  const sendReply = async (postId) => {
    if (!reply[postId]?.trim()) return;
    await axios.post(
      `${API}/community/reply/${postId}`,
      { content: reply[postId] },
      { headers }
    );
    setReply({ ...reply, [postId]: "" });
    loadPosts();
  };

  const aiSuggestReply = async (postId, postContent) => {
    setAiLoading(true);
    const res = await axios.post(
      `${API}/community/ai-reply-suggestion`,
      { content: postContent },
      { headers }
    );
    setReply({ ...reply, [postId]: res.data.suggested_reply });
    setAiLoading(false);
  };

  return (
    <MainLayout>
      <div className={`min-h-screen ${communityTheme.page}`}>
        <div className="max-w-3xl mx-auto p-6 space-y-8">

          {/* Header */}
          <div>
            <h1 className={`text-3xl font-semibold ${communityTheme.heading}`}>
              Community Lounge
            </h1>
            <p className={`text-sm mt-1 ${communityTheme.subText}`}>
              A shared space for discussion, learning, and mentorship
            </p>
          </div>

          {/* Create Post */}
          <div className={`rounded-2xl p-5 shadow-sm ${communityTheme.card}`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Share a question, insight, or experience…"
              className={`w-full rounded-lg p-3 text-sm outline-none focus:ring-2 ${communityTheme.textarea}`}
            />
            <button
              onClick={createPost}
              className={`mt-3 px-5 py-2 rounded-lg text-sm transition ${communityTheme.primaryBtn}`}
            >
              Share with Community
            </button>
          </div>

          {/* Posts */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className={`rounded-2xl p-5 shadow-sm space-y-4 ${communityTheme.card}`}
              >
                {/* Author */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-800">
                    {post.author_name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${communityTheme.badge}`}
                  >
                    {post.author_role}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm text-slate-700 leading-relaxed">
                  {post.content}
                </p>

                {/* Actions */}
                <div className="flex gap-6 text-sm text-slate-500">
                  <button
                    onClick={() => like(post._id)}
                    className="hover:text-slate-800"
                  >
                    👍 {post.likes.length}
                  </button>
                </div>

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div
                    className={`pl-4 space-y-2 ${communityTheme.replyBox}`}
                  >
                    {post.replies.map((r, i) => (
                      <p key={i} className="text-sm text-slate-700">
                        <strong className="text-slate-800">
                          {r.author_name}:
                        </strong>{" "}
                        {r.content}
                      </p>
                    ))}
                  </div>
                )}

                {/* Reply Box */}
                <textarea
                  rows={2}
                  value={reply[post._id] || ""}
                  onChange={(e) =>
                    setReply({ ...reply, [post._id]: e.target.value })
                  }
                  placeholder="Write a thoughtful reply…"
                  className={`w-full rounded-lg p-2 text-sm outline-none ${communityTheme.textarea}`}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => sendReply(post._id)}
                    className={`px-4 py-1.5 rounded-lg text-sm ${communityTheme.primaryBtn}`}
                  >
                    Reply
                  </button>

                  <button
                    onClick={() =>
                      aiSuggestReply(post._id, post.content)
                    }
                    disabled={aiLoading}
                    className={`px-4 py-1.5 rounded-lg text-sm ${communityTheme.secondaryBtn}`}
                  >
                    🤖 AI Assist
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default Community;
