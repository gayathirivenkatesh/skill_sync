import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../api/apiConfig";

const API = `${API_BASE_URL}/api`;

const SessionScheduler = ({ teamId, token, onClose, onScheduled }) => {
  const [datetime, setDatetime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [loading, setLoading] = useState(false);

  const scheduleSession = async () => {
    if (!datetime) {
      alert("Please select a date and time for the session");
      return;
    }

    setLoading(true);
    try {
      // Convert to ISO string
      const isoDatetime = new Date(datetime).toISOString();

      const res = await axios.post(
        `${API}/mentor/sessions/${teamId}`,
        { datetime: isoDatetime, link: meetingLink || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Session scheduled successfully!");
      onScheduled?.(); // Call parent refresh callback if provided
      onClose();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(
        err.response?.data?.detail
          ? Array.isArray(err.response.data.detail)
            ? err.response.data.detail.join(", ")
            : err.response.data.detail
          : "Failed to schedule session"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-scheduler-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >

        {/* Header */}
        <div className="mb-4">
          <h3 id="session-scheduler-title" className="text-xl font-semibold text-slate-900">
            Schedule Mentoring Session
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Choose a date and optionally add a meeting link
          </p>
        </div>

        {/* Date & Time */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Session Date & Time
          </label>
          <input
            type="datetime-local"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </div>

        {/* Meeting Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Meeting Link (optional)
          </label>
          <input
            type="url"
            placeholder="Paste Zoom/Google Meet link"
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-400 outline-none"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={scheduleSession}
            disabled={loading}
            className="px-5 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 transition"
          >
            {loading ? "Scheduling..." : "Schedule Session"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionScheduler;
