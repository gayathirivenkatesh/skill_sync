from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from bson import ObjectId
from database import users_collection, projects_collection, skills_collection
from routes.user_routes import get_current_user
import re
from io import BytesIO
import pdfplumber
import docx

router = APIRouter()

# ----------------- Default known skills -----------------
DEFAULT_SKILLS = [
    "Python", "C", "C++", "Java", "JavaScript", "SQL", "React", "FastAPI",
    "NumPy", "Pandas", "Scikit-learn", "HTML", "CSS", "MongoDB", "Git",
    "Machine Learning", "AI", "RESTful APIs", "Django", "Flask"
]

# ----------------- Helper: Extract skills using regex -----------------
def extract_skills_from_text(text: str, skills_list: List[str]) -> List[str]:
    extracted = []
    text_lower = text.lower()
    for skill in skills_list:
        pattern = re.escape(skill.lower())
        if re.search(rf"\b{pattern}\b", text_lower):
            extracted.append(skill)
    return extracted

# ----------------- Helper: Extract text from uploaded file -----------------
def extract_text_from_file(file: UploadFile, contents: bytes) -> str:
    if file.filename.endswith(".pdf"):
        try:
            with pdfplumber.open(BytesIO(contents)) as pdf:
                return "\n".join([page.extract_text() or "" for page in pdf.pages])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading PDF: {e}")
    elif file.filename.endswith(".docx"):
        try:
            doc = docx.Document(BytesIO(contents))
            return "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading DOCX: {e}")
    else:
        try:
            return contents.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading text file: {e}")

# ----------------- Helper: Store or update skills for a user -----------------
async def store_user_skills(user_id: ObjectId, new_skills: List[str]):
    existing = await skills_collection.find_one({"user_id": user_id})
    if existing:
        merged = list(set(existing.get("skills", []) + new_skills))
        await skills_collection.update_one(
            {"user_id": user_id},
            {"$set": {"skills": merged}}
        )
    else:
        await skills_collection.insert_one({"user_id": user_id, "skills": new_skills})

# ----------------- Extract skills from pasted text -----------------
@router.post("/extract_skills")
async def extract_skills(payload: dict, current_user: dict = Depends(get_current_user)):
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    # Fetch known skills from DB + default
    known_skills_set = set(DEFAULT_SKILLS)
    async for user in users_collection.find({}):
        known_skills_set.update(user.get("skills", []))

    extracted_skills = extract_skills_from_text(text, list(known_skills_set))
    user_id = ObjectId(current_user["_id"])

    # Update user collection (existing logic)
    if extracted_skills:
        current_skills = set(current_user.get("skills") or [])
        new_skills = list(current_skills.union(extracted_skills))
        await users_collection.update_one(
            {"_id": user_id},
            {"$set": {"skills": new_skills}}
        )
        current_user["skills"] = new_skills

    # Store in skills collection (new logic)
    await store_user_skills(user_id, extracted_skills)

    return {"skills": list(set(extracted_skills)), "message": "Skills stored successfully"}

# ----------------- Resume parser (update skills) -----------------
@router.post("/resume-parser")
async def resume_parser(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    contents = await file.read()
    text = extract_text_from_file(file, contents)

    known_skills_set = set(DEFAULT_SKILLS)
    async for user in users_collection.find({}):
        known_skills_set.update(user.get("skills", []))

    extracted_skills = extract_skills_from_text(text, list(known_skills_set))
    user_id = ObjectId(current_user["_id"])

    # Update user skills
    if extracted_skills:
        current_skills = set(current_user.get("skills") or [])
        new_skills = list(current_skills.union(extracted_skills))
        await users_collection.update_one(
            {"_id": user_id},
            {"$set": {"skills": new_skills}}
        )
        current_user["skills"] = new_skills

    # Store in skills collection
    await store_user_skills(user_id, extracted_skills)

    return {"skills": list(set(extracted_skills)), "message": "Skills stored successfully"}

# ----------------- Recommended projects -----------------
@router.get("/recommended-projects")
async def recommended_projects(current_user: dict = Depends(get_current_user)):
    user_skills = set(current_user.get("skills") or [])
    projects_cursor = projects_collection.find({})
    matches = []
    async for p in projects_cursor:
        project_skills = set(p.get("skills_required", []))
        if user_skills.intersection(project_skills):
            matches.append({
                "title": p["title"],
                "skills_required": p.get("skills_required", [])
            })
    return {"projects": matches}

