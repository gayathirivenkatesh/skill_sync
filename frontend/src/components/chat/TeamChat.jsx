import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";


const API_BASE = "http://localhost:8000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const TeamChat = ({ teamId: teamIdProp }) => {
  const params = useParams();
  const teamId = teamIdProp || params.teamId;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Failed to send message");
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
      <p className="text-sm text-red-600" role="alert">
        Team ID missing
      </p>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-slate-800">Team Chat</h3>

      <div className="mb-3 h-[300px] overflow-y-auto rounded-lg bg-slate-50 p-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet</p>
        ) : (
          messages.map((msg, i) => (
            <div key={msg._id || i} className="mb-2">
              <p className="text-sm">
                <strong>{msg.sender_name}:</strong> {msg.text}
              </p>
              <p className="text-xs text-slate-400">
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
        <p className="mb-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`team-chat-${teamId}`} className="sr-only">
          Message
        </label>
        <input
          id={`team-chat-${teamId}`}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          type="button"
          onClick={sendMessage}
          className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Send
        </button>
      </div>
    </section>
  );
};

export const TeamChatPage = () => <TeamChat />;

export default TeamChat;
