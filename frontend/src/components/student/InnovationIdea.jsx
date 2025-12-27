import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";

export default function InnovationIdea() {
  const { id } = useParams();
  const [idea, setIdea] = useState(null);
  const [comment, setComment] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchIdea();
    // eslint-disable-next-line
  }, [id]);

  async function fetchIdea() {
    const res = await fetch(`http://localhost:8000/api/innovation/ideas/${id}`);
    const data = await res.json();
    setIdea(data);
  }

  async function postComment() {
    if (!comment.trim()) return;
    try {
      await fetch(`http://localhost:8000/api/innovation/ideas/${id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: comment }),
      });
      setComment("");
      fetchIdea();
    } catch (e) {
      console.error(e);
    }
  }

  async function requestAi(mode) {
    const res = await fetch(`http://localhost:8000/api/innovation/ideas/${id}/feature-suggestion`, {
      method: "POST",
      headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    alert(data.ai_feedback || "No feedback");
  }

  if (!idea) return <MainLayout><div className="p-6 text-gray-500">Loading…</div></MainLayout>;

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">{idea.title}</h1>
        <p className="text-sm text-gray-600">By {idea.creator_name} • {new Date(idea.created_at).toLocaleString()}</p>
        <p className="mt-4">{idea.details || idea.summary}</p>

        <div className="mt-6">
          <h3 className="font-semibold">Comments</h3>
          <div className="space-y-2 mt-2">
            {idea.comments?.length ? idea.comments.map((c,i) => (
              <div key={i} className="p-2 bg-gray-50 rounded">
                <div className="text-sm font-medium">{c.user_name}</div>
                <div className="text-sm text-gray-700">{c.text}</div>
                <div className="text-xs text-gray-400">{new Date(c.timestamp).toLocaleString()}</div>
              </div>
            )) : <div className="text-gray-500">No comments</div>}
          </div>

          <div className="mt-4 flex gap-2">
            <input value={comment} onChange={e=>setComment(e.target.value)} className="flex-1 border px-3 py-2 rounded" placeholder="Write a comment..." />
            <button onClick={postComment} className="px-3 py-2 bg-blue-600 text-white rounded">Post</button>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={()=>requestAi("feasibility")} className="px-3 py-2 bg-gray-200 rounded">AI Feasibility</button>
            <button onClick={()=>requestAi("impact")} className="px-3 py-2 bg-gray-200 rounded">AI Impact</button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
