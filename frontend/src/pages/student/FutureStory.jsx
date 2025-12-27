import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiPlay, FiRefreshCw } from "react-icons/fi";
import MainLayout from "../../layouts/MainLayout";

const API = "http://localhost:8000/api";

const FutureStory = () => {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    interest_role: "Frontend Developer",
    dream_company_type: "product",
    time_horizon: "1 year",
    current_struggle: "consistency",
  });

  const [story, setStory] = useState(null);
  const [hasStory, setHasStory] = useState(true);
  const [loading, setLoading] = useState(false);

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);

      const female = v.find((voice) =>
        /female|woman|zira|samantha|google us english female/i.test(voice.name)
      );

      setSelectedVoice(female || v[0] || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${API}/future-story/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.status === "generated") {
          setStory(res.data.data);
          setHasStory(true);
        } else {
          setStory(null);
          setHasStory(false);
        }
      })
      .catch(() => setHasStory(false));
  }, [token]);

  const generateStory = async () => {
    if (!token) {
      alert("Please login again");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/future-story/generate`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "generated") {
        setStory(res.data.data);
        setHasStory(true);
      }
    } catch {
      alert("Failed to generate future story");
    }
    setLoading(false);
  };

  const narrate = () => {
    if (!story || !window.speechSynthesis) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const narrationText = `
      ${story.story}.
      Steps to achieve this:
      ${story.action_steps.join(". ")}.
      ${story.motivation_line}
    `;

    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  const chooseFemale = () => {
    const v = voices.find((x) =>
      /female|woman|zira|samantha|google us english female/i.test(x.name)
    );
    if (v) setSelectedVoice(v);
  };

  const chooseMale = () => {
    const v = voices.find((x) =>
      /male|man|david|mark|google us english/i.test(x.name)
    );
    if (v) setSelectedVoice(v);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        <h1 className="text-3xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
          🌟 Your AI Future Story
        </h1>

        {/* Preferences Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl shadow-lg border border-indigo-100">
          <input
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Desired Role"
            value={form.interest_role}
            onChange={(e) =>
              setForm({ ...form, interest_role: e.target.value })
            }
          />

          <select
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={form.dream_company_type}
            onChange={(e) =>
              setForm({ ...form, dream_company_type: e.target.value })
            }
          >
            <option value="startup">Startup</option>
            <option value="product">Product</option>
            <option value="faang">FAANG</option>
            <option value="service">Service</option>
          </select>

          <select
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={form.time_horizon}
            onChange={(e) =>
              setForm({ ...form, time_horizon: e.target.value })
            }
          >
            <option value="6 months">6 months</option>
            <option value="1 year">1 year</option>
            <option value="2 years">2 years</option>
          </select>

          <select
            className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={form.current_struggle}
            onChange={(e) =>
              setForm({ ...form, current_struggle: e.target.value })
            }
          >
            <option value="consistency">Consistency</option>
            <option value="confidence">Confidence</option>
            <option value="coding">Coding</option>
            <option value="direction">Direction</option>
          </select>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generateStory}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 hover:scale-105 transition-all duration-300 disabled:opacity-60"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            {loading ? "Generating..." : "Generate / Update Story"}
          </button>
        </div>

        {/* Story */}
        {hasStory && story && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-indigo-100 space-y-4">
            <p className="text-gray-800 leading-relaxed text-lg">
              {story.story}
            </p>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">
                ✅ Steps to Achieve Your Goal
              </h3>
              <ul className="list-decimal list-inside space-y-1 text-gray-700">
                {Array.isArray(story.action_steps) &&
                  story.action_steps.map((step, i) => <li key={i}>{step}</li>)}
              </ul>
            </div>

            <p className="mt-2 text-violet-700 font-semibold italic text-lg">
              {story.motivation_line}
            </p>

            {/* Voice Controls */}
          {/* Voice Controls */}
<div className="mt-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
  <div className="flex flex-wrap gap-4 justify-between items-center">

    {/* Gender toggle */}
    <div className="flex items-center gap-2">

      <button
        onClick={chooseFemale}
        className={`px-4 py-2 rounded-lg text-sm font-medium border transition
        ${selectedVoice && /female|woman/i.test(selectedVoice.name)
          ? "bg-indigo-600 text-white border-indigo-600 shadow"
          : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-100"
        }`}
      >
        Female
      </button>

      <button
        onClick={chooseMale}
        className={`px-4 py-2 rounded-lg text-sm font-medium border transition
        ${selectedVoice && /male|man/i.test(selectedVoice.name)
          ? "bg-indigo-600 text-white border-indigo-600 shadow"
          : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-100"
        }`}
      >
        Male
      </button>

      {/* Voice list select */}
      <select
        className="border p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
        value={selectedVoice?.name || ""}
        onChange={(e) =>
          setSelectedVoice(voices.find((v) => v.name === e.target.value))
        }
      >
        {voices.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name}
          </option>
        ))}
      </select>
    </div>

    {/* Narrate button */}
    <button
      onClick={narrate}
      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg shadow flex items-center gap-2 hover:scale-105 transition"
    >
      <FiPlay />
      {speaking ? "Stop" : "Listen to Your Future"}
    </button>
  </div>
</div>

          </div>
        )}

        {!hasStory && (
          <p className="mt-6 text-gray-500 text-center">
            You haven’t generated your future story yet. Start now to visualize your growth! 🚀
          </p>
        )}
      </div>
    </MainLayout>
  );
};

export default FutureStory;
