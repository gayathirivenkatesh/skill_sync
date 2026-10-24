import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const ResumeUploader = ({ onExtracted }) => {
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    // Send the actual file to SkillMapper for backend processing
    onExtracted(file);
  };

  return (
    <div>
      <input
        type="file"
        accept="application/pdf,.docx,.txt"
        onChange={handleFileUpload}
      />
      {fileName && (
        <p className="mt-2 text-sm text-gray-600">Uploaded: {fileName}</p>
      )}
    </div>
  );
};


export default ResumeUploader;
