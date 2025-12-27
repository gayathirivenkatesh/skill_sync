import { useEffect, useState, useContext } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { AuthContext } from "../../context/AuthContext";
import { AlertTriangle, FileText, RefreshCw } from "lucide-react";

const API = "http://localhost:8000/api";

const MentorPlagiarism = () => {
  const { token } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [threshold, setThreshold] = useState(70);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/mentor/plagiarism`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data.alerts || []);
      setThreshold(res.data.threshold || 70);
    } catch {
      setError("Failed to load plagiarism alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [token]);

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-indigo-700">Plagiarism Alerts</h1>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading alerts...</p>}
      {error && (
        <div className="bg-red-50 p-3 rounded mb-4 text-red-700">{error}</div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="bg-green-50 p-4 rounded">No plagiarism alerts</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {alerts.map((team) => (
          <PlagiarismCard key={team.team_id} team={team} threshold={threshold} />
        ))}
      </div>
    </MainLayout>
  );
};

const PlagiarismCard = ({ team, threshold }) => {
  const severity =
    team.score >= threshold + 20
      ? "high"
      : team.score >= threshold
      ? "medium"
      : "low";

  const bgColor =
    severity === "high"
      ? "bg-red-500 text-white"
      : severity === "medium"
      ? "bg-yellow-400 text-black"
      : "bg-green-400 text-black";

  return (
    <div className={`rounded-xl shadow p-5 flex flex-col justify-between ${bgColor}`}>
      <div>
        <h3 className="text-lg font-semibold mb-2">{team.team_name}</h3>
        <p className="mb-1">
          Plagiarism Score: <span className="font-bold">{team.score}%</span>
        </p>
        <p className="mb-2">
          Files Submitted: {team.files.length}{" "}
          <FileText className="inline ml-1" size={16} />
        </p>
      </div>

      <button
        onClick={() =>
          alert(
            `Files:\n${team.files.map((f) => f.name || f).join("\n")}`
          )
        }
        className="mt-3 bg-white text-gray-800 py-1 px-3 rounded hover:bg-gray-100 text-sm flex items-center gap-1 justify-center"
      >
        <AlertTriangle size={16} /> View Files
      </button>
    </div>
  );
};

export default MentorPlagiarism;
