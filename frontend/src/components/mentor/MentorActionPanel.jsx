import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const API = "http://localhost:8000/api";

const MentorActionPanel = ({ teamId }) => {
  const { token } = useContext(AuthContext);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Load existing mentor notes
  useEffect(() => {
    if (!teamId || !token) return;

    const fetchNotes = async () => {
      try {
        const res = await axios.get(
          `${API}/mentor/notes/${teamId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotes(res.data.notes || "");
      } catch (err) {
        console.error("Failed to load mentor notes");
      }
    };

    fetchNotes();
  }, [teamId, token]);

  const saveNotes = async () => {
    if (!notes.trim()) {
      alert("Notes cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/mentor/notes/${teamId}`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Mentor notes saved");
      // ❌ DO NOT clear notes
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to save notes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 border-t pt-3">
      <p className="text-sm font-medium mb-1 text-gray-700">
        Mentor Notes
      </p>

      <textarea
        className="w-full border p-2 rounded mb-2 text-sm"
        placeholder="Add private mentor notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        disabled={loading}
      />

      <button
        onClick={saveNotes}
        disabled={loading}
        className="w-full bg-yellow-500 text-white py-1.5 rounded hover:bg-yellow-600 text-sm"
      >
        {loading ? "Saving..." : "Save Notes"}
      </button>
    </div>
  );
};

export default MentorActionPanel;
