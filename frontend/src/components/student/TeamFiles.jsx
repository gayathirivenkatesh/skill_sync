import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { UploadCloud, FileText, Trash2, Lock } from "lucide-react";

const API = "http://localhost:8000/api/team-files";

const TeamFiles = ({ teamId, isLocked, isCreator, userId, onFilesUpdate }) => {
  const { token } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  /* ================= FETCH FILES ================= */
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${API}/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = res.data.files || [];
      setFiles(list);
      onFilesUpdate?.(list);
    } catch {
      setFiles([]);
      onFilesUpdate?.([]);
    }
  };

  useEffect(() => {
    if (teamId) fetchFiles();
  }, [teamId, token]);

  /* ================= UPLOAD FILE ================= */
  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/upload/${teamId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const newFile = {
        id: res.data.file_id,
        filename: file.name,
        uploaded_by: userId,
      };

      const updated = [...files, newFile];
      setFiles(updated);
      onFilesUpdate?.(updated);
    } catch (err) {
      alert(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ================= DELETE FILE ================= */
  const deleteFile = async (fileId) => {
    if (!window.confirm("Delete this file permanently?")) return;

    try {
      await axios.delete(`${API}/${teamId}/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updated = files.filter((f) => f.id !== fileId);
      setFiles(updated);
      onFilesUpdate?.(updated);
    } catch {
      alert("Delete failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">📁 Team Files</h3>

        {isLocked && (
          <span className="flex items-center gap-1 text-sm text-red-600">
            <Lock size={14} /> Locked
          </span>
        )}
      </div>

      {/* Upload */}
      {isCreator && !isLocked && (
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white cursor-pointer hover:bg-slate-800 w-fit">
          <UploadCloud size={18} />
          {uploading ? "Uploading..." : "Upload File"}
          <input
            type="file"
            onChange={uploadFile}
            disabled={uploading}
            hidden
          />
        </label>
      )}

      {/* Files */}
      {files.length > 0 ? (
        <div className="grid gap-3">
          {files.map((file) => {
            const canDelete =
              (isCreator || file.uploaded_by === userId) && !isLocked;

            return (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border p-3 bg-slate-50 hover:bg-slate-100"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-slate-500" size={20} />
                  <span className="text-sm font-medium text-slate-700">
                    {file.filename}
                  </span>
                </div>

                {canDelete && (
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete file"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No files uploaded yet.
        </p>
      )}
    </div>
  );
};

export default TeamFiles;
