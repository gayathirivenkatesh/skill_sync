import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API = "http://localhost:8000/api";

const MentorSessions = () => {
  const { token } = useContext(AuthContext);
  const { state } = useLocation();
  const defaultTeamId = state?.teamId || null;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState({});
  const [newDate, setNewDate] = useState(new Date());
  const [selectedTeamId, setSelectedTeamId] = useState(defaultTeamId);

  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/mentor/sessions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data);

      const initialLinks = {};
      res.data.forEach((s) => {
        initialLinks[s.id] = s.link || "";
      });
      setLinks(initialLinks);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const scheduleSession = async () => {
    if (!selectedTeamId || !newDate) return;
    try {
      await axios.post(
        `${API}/mentor/sessions/${selectedTeamId}`,
        { datetime: newDate.toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Demo session scheduled");
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to schedule session");
    }
  };

  const updateLink = async (sessionId) => {
    if (!links[sessionId]) return;
    try {
      await axios.post(
        `${API}/mentor/sessions/${sessionId}/link`,
        { link: links[sessionId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Meeting link updated");
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to update link");
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await axios.delete(`${API}/mentor/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Session deleted");
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.detail || "Failed to delete session");
    }
  };

  if (loading) return <MainLayout><p className="p-6">Loading...</p></MainLayout>;

  return (
    <MainLayout>
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Demo Sessions</h2>

        {/* Schedule new session if redirected from a team */}
        {selectedTeamId && (
          <div className="border p-4 mb-4">
            <h3 className="font-semibold mb-2">Schedule Session for Team {selectedTeamId}</h3>
            <DatePicker
              selected={newDate}
              onChange={(date) => setNewDate(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="border p-2 rounded w-full"
            />
            <button
              className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
              onClick={scheduleSession}
            >
              Schedule Demo
            </button>
          </div>
        )}

        <table className="w-full border-collapse border">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Team</th>
              <th className="p-2 text-left">Date & Time</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Link</th>
              <th className="p-2 text-left">Add/Update Link</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.team_name}</td>
                <td className="p-2">{new Date(s.datetime).toLocaleString()}</td>
                <td className="p-2">{s.status}</td>
                <td className="p-2">
                  {s.link ? <a href={s.link} target="_blank" rel="noreferrer" className="text-blue-600">Join</a> : "N/A"}
                </td>
                <td className="p-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter meeting link"
                    value={links[s.id]}
                    onChange={(e) => setLinks({ ...links, [s.id]: e.target.value })}
                    className="border p-1 rounded w-full"
                  />
                  <button
                    className="bg-blue-600 text-white px-2 rounded"
                    onClick={() => updateLink(s.id)}
                  >
                    Save
                  </button>
                </td>
                <td className="p-2">
                  <button
                    className="bg-red-600 text-white px-2 rounded"
                    onClick={() => deleteSession(s.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
};

export default MentorSessions;
