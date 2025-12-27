import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Send, BrainCircuit, Trophy } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";

const aiTheme = {
  page: "bg-gradient-to-br from-amber-50 via-orange-50/40 to-emerald-50",
  container: "bg-white border border-amber-200",
  heading: "text-emerald-800",
  label: "text-slate-700",
  input:
    "border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400",
  primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
  chatBox: "bg-amber-50 border border-amber-200",
  aiBubble: "bg-emerald-100 text-emerald-900",
  userBubble: "bg-amber-200 text-amber-900",
  xpText: "text-amber-700",
  feedbackBox: "bg-emerald-50 text-emerald-800 border border-emerald-200",
};

export default function AiLearningSession() {
  const [skill, setSkill] = useState("");
  const [session, setSession] = useState(null); // stores { session_id, status }
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const token = localStorage.getItem("token");
  const API_BASE = "http://localhost:8000";

  // ---------- Check for existing session ----------
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/ai/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.session_id) {
          setSession(res.data);
          setXp(res.data.xp || 0);
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.log("No existing session", err);
      }
    };
    fetchStatus();
  }, []);

  // ---------- Track Scroll Engagement ----------
  useEffect(() => {
    const handleScroll = async () => {
      if (!session?.session_id) return;
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 5) {
        await axios.post(
          `${API_BASE}/api/ai/progress`,
          { session_id: session.session_id, progress: scrollPercent },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [session]);

  // ---------- Start Session ----------
  const startSession = async () => {
    if (!skill) return alert("Please select a skill first!");
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/ai/start`,
        { skill },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSession({ session_id: res.data.session_id, status: "started" });
      setMessages([
        {
          role: "ai",
          text: `Let's begin! First question on ${skill}: ${res.data.question}`,
        },
      ]);
    } catch {
      alert("Error starting session");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Resume Session ----------
  const resumeSession = async () => {
    if (!session?.session_id) return;
    try {
      // fetch last messages or question
      const res = await axios.get(`${API_BASE}/api/ai/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch {
      alert("Error resuming session");
    }
  };

  // ---------- Submit Answer ----------
  const submitAnswer = async () => {
    if (!answer.trim() || !session?.session_id) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/ai/monitor`,
        { session_id: session.session_id, answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setXp((prev) => prev + (res.data.xp_added || 0));
      setFeedback(res.data.feedback);

      setMessages((prev) => [
        ...prev,
        { role: "user", text: answer },
        { role: "ai", text: res.data.feedback },
        ...(res.data.next_question
          ? [{ role: "ai", text: `Next question: ${res.data.next_question}` }]
          : []),
      ]);

      setAnswer("");

      // update progress status as active
      await axios.post(
        `${API_BASE}/api/ai/progress`,
        { session_id: session.session_id, progress: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSession((prev) => ({ ...prev, status: "active" }));
    } catch {
      alert("Error submitting answer");
    } finally {
      setLoading(false);
    }
  };

  // ---------- End Session ----------
  const endSession = async () => {
    if (!session?.session_id) return;
    await axios.post(
      `${API_BASE}/api/ai/end`,
      { session_id: session.session_id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert(`Session ended! You earned ${xp} XP`);
    setSession(null);
    setMessages([]);
    setXp(0);
    setFeedback("");
  };

  return (
    <MainLayout>
      <motion.div
        className={`max-w-3xl mx-auto mt-10 p-6 rounded-2xl shadow-lg ${aiTheme.container}`}
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <BrainCircuit className="text-emerald-600" />
          <h1 className={`text-2xl font-semibold ${aiTheme.heading}`}>
            AI Guided Learning Session
          </h1>
        </div>

        {!session ? (
          <>
            <label className={`block mb-2 font-medium ${aiTheme.label}`}>
              Choose a skill to practice
            </label>
            <input
              className={`w-full ${aiTheme.input}`}
              placeholder="Python, Machine Learning, DSA..."
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
            <button
              onClick={startSession}
              disabled={loading}
              className={`mt-4 px-6 py-2 rounded-xl ${aiTheme.primaryBtn}`}
            >
              {loading ? "Starting..." : "Start Learning"}
            </button>
          </>
        ) : (
          <>
            {/* Resume Learning Button */}
            {session.status === "started" && (
              <button
                onClick={resumeSession}
                className={`mb-4 px-6 py-2 rounded-xl ${aiTheme.primaryBtn}`}
              >
                Resume Learning
              </button>
            )}

            {/* Chat / Questions */}
            <div
              className={`h-72 overflow-y-auto p-4 rounded-xl mb-4 space-y-3 ${aiTheme.chatBox}`}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`p-3 rounded-lg max-w-[80%] ${
                    msg.role === "ai"
                      ? `${aiTheme.aiBubble}`
                      : `${aiTheme.userBubble} ml-auto`
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {msg.text}
                </motion.div>
              ))}
            </div>

            {/* Answer Input */}
            <textarea
              className={`w-full h-24 resize-none ${aiTheme.input}`}
              placeholder="Type your answer…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={submitAnswer}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl ${aiTheme.primaryBtn}`}
              >
                <Send size={16} /> {loading ? "Sending..." : "Submit"}
              </button>
              <button
                onClick={endSession}
                className="text-sm text-red-500 hover:underline"
              >
                End Session
              </button>
            </div>

            {/* XP */}
            <div className={`flex items-center gap-2 mt-4 ${aiTheme.xpText}`}>
              <Trophy size={18} />
              <span className="font-medium">XP Earned: {xp}</span>
            </div>

            {/* Feedback */}
            {feedback && (
              <motion.div
                className={`mt-4 p-4 rounded-lg ${aiTheme.feedbackBox}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                🧠 {feedback}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </MainLayout>
  );
}
