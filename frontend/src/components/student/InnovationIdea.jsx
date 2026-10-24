
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export default function InnovationIdea() {
  const { id } = useParams();
  const [idea, setIdea] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchIdea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchIdea() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/innovation/ideas/${encodeURIComponent(id)}`
      );

      if (!res.ok) {
        throw new Error(`Failed to load idea (HTTP ${res.status})`);
      }

      const data = await res.json();
      setIdea(data);
    } catch (e) {
      console.error("fetchIdea error:", e);
      setError("Unable to load this idea. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function postComment() {
    if (!comment.trim() || posting) return;

    if (!token) {
      setError("Please log in to post a comment.");
      return;
    }

    setPosting(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/innovation/ideas/${encodeURIComponent(id)}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: comment.trim() }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to post comment (HTTP ${res.status})`);
      }

      setComment("");
      await fetchIdea();
    } catch (e) {
      console.error("postComment error:", e);
      setError("Unable to post your comment. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  async function requestAi(mode) {
    if (!token) {
      setError("Please log in to request AI feedback.");
      return;
    }

    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/innovation/ideas/${encodeURIComponent(id)}/feature-suggestion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mode }),
        }
      );

      if (!res.ok) {
        throw new Error(`AI request failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      alert(data.ai_feedback || "No feedback available.");
    } catch (e) {
      console.error("requestAi error:", e);
      setError("Unable to get AI feedback. Please try again.");
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading…</div>;
  }

  if (error && !idea) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchIdea}
          className="mt-3 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!idea) {
    return <div className="p-6 text-gray-500">Idea not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{idea.title}</h1>

      <p className="text-sm text-gray-600">
        By {idea.creator_name} •{" "}
        {idea.created_at
          ? new Date(idea.created_at).toLocaleString()
          : "Date unavailable"}
      </p>

      <p className="mt-4">{idea.details || idea.summary}</p>

      <div className="mt-6">
        <h3 className="font-semibold">Comments</h3>

        <div className="mt-2 space-y-2">
          {idea.comments?.length ? (
            idea.comments.map((c, i) => (
              <div key={c._id || i} className="rounded bg-gray-50 p-2">
                <div className="text-sm font-medium">{c.user_name}</div>
                <div className="text-sm text-gray-700">{c.text}</div>
                <div className="text-xs text-gray-400">
                  {c.timestamp
                    ? new Date(c.timestamp).toLocaleString()
                    : ""}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500">No comments</div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-w-0 flex-1 rounded border px-3 py-2"
            placeholder="Write a comment..."
            onKeyDown={(e) => {
              if (e.key === "Enter") postComment();
            }}
          />
          <button
            onClick={postComment}
            disabled={posting || !comment.trim()}
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => requestAi("feasibility")}
            className="rounded bg-gray-200 px-3 py-2"
          >
            AI Feasibility
          </button>
          <button
            onClick={() => requestAi("impact")}
            className="rounded bg-gray-200 px-3 py-2"
          >
            AI Impact
          </button>
        </div>
      </div>
    </div>
  );
}
