import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api";

/* ---------- AXIOS INSTANCE ---------- */
const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const TeamChat = ({ teamId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- FETCH CHAT ---------- */
  const fetchChat = async () => {
    if (!teamId) return;

    try {
      setError("");
      const res = await axiosInstance.get(`/team/${teamId}/chat`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Error fetching chat:", err);
      setError("Failed to load chat");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SEND MESSAGE ---------- */
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await axiosInstance.post(`/team/${teamId}/chat`, {
        text: newMessage.trim(),
      });
      setNewMessage("");
      fetchChat();
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  useEffect(() => {
    if (!teamId) return;

    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [teamId]);

  if (!teamId) {
    return (
      <p className="text-red-600 text-sm">
        Team ID missing
      </p>
    );
  }

  return (
    <div className="border rounded p-4 bg-gray-50">

      {/* Messages */}
      <div className="h-[300px] overflow-y-auto mb-3">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages yet</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm">
                <strong>{msg.sender_name}:</strong>{" "}
                {msg.text}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(msg.timestamp).toLocaleString("en-IN", {
  hour12: false,
  timeZone: "Asia/Kolkata",
})}

              </p>
            </div>
          ))
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs mb-2">{error}</p>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TeamChat;
