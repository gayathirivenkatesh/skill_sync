from typing import List
from io import BytesIO
from PyPDF2 import PdfReader
from docx import Document

# ---------------- Extract text from uploaded resume ----------------
def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    if filename.endswith(".pdf"):
        reader = PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    elif filename.endswith(".docx"):
        doc = Document(BytesIO(file_bytes))
        text = "\n".join([p.text for p in doc.paragraphs])
        return text
    elif filename.endswith(".txt"):
        return file_bytes.decode("utf-8")
    else:
        return ""

# ---------------- Extract skills from text ----------------
def extract_skills_from_text(text: str, known_skills: List[str]) -> List[str]:
    extracted = []
    for skill in known_skills:
        if skill.lower() in text.lower():
            extracted.append(skill)
    return extracted

# ---------------- Recommend jobs based on extracted skills ----------------
def recommend_jobs_for_skills(skills: List[str]) -> List[str]:
    jobs = []
    if "Python" in skills and "Django" in skills:
        jobs.append("Backend Developer (Python/Django)")
    if "Python" in skills and "FastAPI" in skills:
        jobs.append("API Engineer (FastAPI)")
    if "React" in skills:
        jobs.append("Frontend Developer (React)")
    if "SQL" in skills:
        jobs.append("Data Analyst")
    if "Node.js" in skills:
        jobs.append("Fullstack Developer (Node.js + React)")
    return jobs
