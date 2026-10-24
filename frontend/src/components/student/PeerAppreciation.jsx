import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const API = "http://localhost:8000/api";

const PeerAppreciation = ({ teamId, teamMembers = [] }) => {
  const { token, user } = useContext(AuthContext);

  const [toUser, setToUser] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const [received, setReceived] = useState([]);

  if (!teamId || !user) return null;

  const safeMembers = Array.isArray(teamMembers) ? teamMembers : [];

  /* ================= FETCH RECEIVED APPRECIATIONS ================= */

  const fetchReceived = async () => {
    try {
      const res = await axios.get(
        `${API}/team/peer-appreciation/${teamId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReceived(res.data.appreciations || []);
    } catch {
      setReceived([]);
    }
  };

  useEffect(() => {
    fetchReceived();
  }, [teamId]);

  /* ================= SEND APPRECIATION ================= */

  const submit = async () => {
    if (!toUser || !message.trim()) {
      alert("Select a teammate and write a message");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API}/team/peer-appreciation/${teamId}`,
        { to_user: toUser, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSent(true);
      setMessage("");
      setToUser("");
    } catch {
      alert("Failed to send appreciation");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="mt-8 space-y-6">

      {/* ================= SEND BOX ================= */}
      <div className="bg-white p-5 rounded-xl border space-y-4">
        <h3 className="text-lg font-semibold">Peer Appreciation</h3>
        <p className="text-sm text-slate-500">
          Privately appreciate a teammate’s contribution.
        </p>

        <select
          value={toUser}
          onChange={(e) => setToUser(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select teammate</option>

          {safeMembers
            .filter(
              (m) => String(m._id || m.id) !== String(user.id)
            )
            .map((m) => (
              <option key={m._id || m.id} value={m._id || m.id}>
                {m.name || m.full_name || m.username || "Unnamed member"}
              </option>
            ))}
        </select>

        <textarea
          rows={3}
          className="w-full border rounded-lg p-3"
          placeholder="Thank you for helping with testing…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Sending..." : "Send Appreciation"}
        </button>

        {sent && (
          <p className="text-sm text-emerald-600">
            Appreciation sent successfully 🌱
          </p>
        )}
      </div>

      {/* ================= RECEIVED BOX ================= */}
      {received.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
          <h3 className="text-lg font-semibold mb-3">
            🌟 Appreciations for You
          </h3>

          <div className="space-y-3">
            {received.map((a) => (
              <div
                key={a._id}
                className="bg-white p-4 rounded-lg shadow-sm"
              >
                <p className="text-slate-700">{a.message}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default PeerAppreciation;
