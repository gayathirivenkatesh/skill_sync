import React, { useEffect, useState } from "react";

import jsPDF from "jspdf";

const API = "http://localhost:8000/api/innovation";

const studentTheme = {
  page: "bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50",
  card: "bg-white border border-rose-200",
  heading: "text-rose-900",
  subText: "text-rose-700",
  input:
    "border border-rose-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400",
  primaryBtn: "bg-rose-600 hover:bg-rose-700 text-white",
  secondaryBtn: "bg-orange-500 hover:bg-orange-600 text-white",
  deleteBtn: "bg-red-500 hover:bg-red-600 text-white",
  editBtn: "bg-amber-500 hover:bg-amber-600 text-white",
  tag: "bg-rose-100 text-rose-800",
};

export default function InnovationLab() {
  const [ideas, setIdeas] = useState([]);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [tags, setTags] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [showPinChange, setShowPinChange] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    fetchIdeas();

    if (!localStorage.getItem("ideas_pin")) {
      localStorage.setItem("ideas_pin", "1234");
    }
  }, []);

  async function fetchIdeas() {
    try {
      const res = await fetch(`${API}/ideas`);
      const data = await res.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      console.error("Fetch ideas failed", err);
    }
  }

  function unlock() {
    const saved = localStorage.getItem("ideas_pin");
    if (pinInput === saved) setIsUnlocked(true);
    else alert("Incorrect PIN");
  }

  function changePin() {
    const saved = localStorage.getItem("ideas_pin");

    if (oldPin !== saved) {
      alert("Old PIN incorrect");
      return;
    }
    if (newPin !== confirmPin) {
      alert("Pins do not match");
      return;
    }

    localStorage.setItem("ideas_pin", newPin);
    setShowPinChange(false);
    setOldPin("");
    setNewPin("");
    setConfirmPin("");

    alert("PIN changed");
  }

  async function saveIdea(e) {
    e.preventDefault();

    const payload = {
      title,
      summary,
      details,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    };

    const token = localStorage.getItem("token");

    // ---------- CREATE ----------
    if (!editingId) {
      const res = await fetch(`${API}/ideas/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      await res.json();
      await fetchIdeas();
    }

    // ---------- UPDATE ----------
    else {
      await fetch(`${API}/ideas/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await fetchIdeas();
    }

    setTitle("");
    setSummary("");
    setDetails("");
    setTags("");
    setEditingId(null);
    setShowForm(false);
  }

  // ---------- DELETE PERMANENT ----------
  async function deleteIdea(id) {
    await fetch(`${API}/ideas/${id}`, {
      method: "DELETE",
    });

    await fetchIdeas(); // refresh after delete
  }

  function startEdit(idea) {
    setEditingId(idea.id);
    setTitle(idea.title);
    setSummary(idea.summary);
    setDetails(idea.details);
    setTags((idea.tags || []).join(", "));
    setShowForm(true);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.text("My Innovation Ideas", 10, 10);

    let y = 20;

    ideas.forEach(idea => {
      doc.text(`Title: ${idea.title}`, 10, y); y += 7;
      doc.text(`Summary: ${idea.summary}`, 10, y); y += 7;
      doc.text(`Tags: ${(idea.tags || []).join(", ")}`, 10, y); y += 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("ideas.pdf");
  }

  function formatDateIST(isoString) {

  // if timestamp has no timezone, assume UTC
  const normalized =
    isoString.endsWith("Z") ? isoString : isoString + "Z";

  const date = new Date(normalized);

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}


  if (!isUnlocked) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
          <h2 className="mb-3 text-xl font-semibold">Enter PIN to unlock ideas</h2>

          <label htmlFor="ideas-pin" className="sr-only">PIN</label>
          <input
            id="ideas-pin"
            type="password"
            className={studentTheme.input + " mb-3 w-full"}
            placeholder="Enter PIN"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
          />

          <button
            onClick={unlock}
            className={`px-4 py-2 rounded ${studentTheme.primaryBtn} w-full`}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-2xl p-4 sm:p-6 ${studentTheme.page}`}>
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${studentTheme.heading}`}>
              💡 My Innovation Ideas
            </h2>
            <p className={studentTheme.subText}>Private space — stays until you delete.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowForm(true)}
              className={`px-4 py-2 rounded ${studentTheme.primaryBtn}`}
            >
              + New Idea
            </button>

            <button
              onClick={exportPDF}
              className={`px-4 py-2 rounded ${studentTheme.secondaryBtn}`}
            >
              Export PDF
            </button>

            <button
              onClick={() => setShowPinChange(true)}
              className="px-4 py-2 rounded bg-gray-700 text-white"
            >
              Change PIN
            </button>
          </div>
        </div>

        {/* PIN CHANGE */}
        {showPinChange && (
          <div className="bg-white border p-4 rounded-xl mb-5">
            <h3 className="font-semibold mb-3">Change PIN</h3>

            <label htmlFor="old-pin" className="sr-only">Old PIN</label>
            <input id="old-pin" type="password" className={studentTheme.input + " mb-2 w-full"} placeholder="Old PIN" value={oldPin} onChange={e => setOldPin(e.target.value)} />
            <label htmlFor="new-pin" className="sr-only">New PIN</label>
            <input id="new-pin" type="password" className={studentTheme.input + " mb-2 w-full"} placeholder="New PIN" value={newPin} onChange={e => setNewPin(e.target.value)} />
            <label htmlFor="confirm-pin" className="sr-only">Confirm PIN</label>
            <input id="confirm-pin" type="password" className={studentTheme.input + " mb-3 w-full"} placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} />

            <div className="flex gap-3">
              <button onClick={changePin} className={`px-4 py-2 rounded ${studentTheme.primaryBtn}`}>Save PIN</button>
              <button onClick={() => setShowPinChange(false)} className="px-4 py-2 rounded bg-gray-300">Cancel</button>
            </div>
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <div className="bg-white border p-4 rounded-xl mb-5">
            <h3 className="font-semibold mb-3">
              {editingId ? "Edit Idea" : "Create Idea"}
            </h3>

            <form onSubmit={saveIdea} className="space-y-3">
              <label htmlFor="idea-title" className="sr-only">Title</label>
              <input id="idea-title" className={studentTheme.input + " w-full"} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
              <label htmlFor="idea-summary" className="sr-only">Short summary</label>
              <input id="idea-summary" className={studentTheme.input + " w-full"} placeholder="Short Summary" value={summary} onChange={e => setSummary(e.target.value)} required />
              <label htmlFor="idea-details" className="sr-only">Details</label>
              <textarea id="idea-details" className={studentTheme.input + " w-full"} placeholder="Details" value={details} onChange={e => setDetails(e.target.value)} />
              <label htmlFor="idea-tags" className="sr-only">Tags</label>
              <input id="idea-tags" className={studentTheme.input + " w-full"} placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} />

              <div className="flex gap-3">
                <button className={`px-4 py-2 rounded ${studentTheme.secondaryBtn}`}>Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* LIST */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ideas.map(idea => (
            <div key={idea.id} className={`p-4 rounded-xl shadow ${studentTheme.card}`}>
              <h3 className="font-semibold text-lg">{idea.title}</h3>
              <p className="text-sm">{idea.summary}</p>

              <div className="text-xs text-gray-500">
                {formatDateIST(idea.created_at || idea.createdAt)}
              </div>

              <div className="mt-2">
                {(idea.tags || []).map((t, i) => (
                  <span key={i} className={`mr-2 px-2 py-1 rounded ${studentTheme.tag}`}>
                    #{t}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <button onClick={() => startEdit(idea)} className={`px-2 py-1 rounded ${studentTheme.editBtn}`}>Edit</button>

                <button onClick={() => deleteIdea(idea.id)} className={`px-2 py-1 rounded ${studentTheme.deleteBtn}`}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
