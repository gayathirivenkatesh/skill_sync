from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import users_collection, projects_collection, skills_collection, career_pathways_collection
from routes.user_routes import get_current_user
from typing import List, Dict
import httpx, os, json

router = APIRouter(prefix="/api/career-pathways", tags=["Career Pathways"])

HUGGINGFACE_API = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"
HUGGINGFACE_KEY = os.getenv("HUGGINGFACE_API_KEY")


# ------------------ Helpers ------------------
def compute_alignment(user_skills: List[str], track_skills: List[str]) -> Dict:
    user_lower = [s.lower() for s in user_skills]
    matched = [s for s in track_skills if s.lower() in user_lower]
    missing = [s for s in track_skills if s.lower() not in user_lower]
    alignment = (len(matched) / len(track_skills)) * 100 if track_skills else 0
    return {"alignment_score": round(alignment, 2), "missing_skills": missing}


async def suggest_career_tracks(user_keywords: List[str]) -> List[Dict]:
    prompt = (
        f"Suggest 5 suitable career tracks for a professional with skills and interests: {', '.join(user_keywords)}. "
        "Include title, description, core skills, industries, and growth score (1-10) in JSON array."
    )

    headers = {"Authorization": f"Bearer {HUGGINGFACE_KEY}"} if HUGGINGFACE_KEY else {}
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.post(HUGGINGFACE_API, json={"inputs": prompt}, headers=headers)
            ai_result = resp.json()
            if isinstance(ai_result, list) and ai_result:
                generated_text = ai_result[0].get("generated_text", "[]")
                return json.loads(generated_text)
        except Exception as e:
            print("AI Career Suggestion Error:", e)

    # Fallback: DB mapping
    tracks = []
    skill_docs = await skills_collection.find({"skill": {"$in": user_keywords}}).to_list(None)
    for doc in skill_docs:
        track_title = doc.get("recommended_career")
        if track_title:
            tracks.append({
                "title": track_title,
                "description": doc.get("career_description", f"Work in {track_title} domain"),
                "core_skills": doc.get("related_skills", user_keywords),
                "industries": doc.get("industries", ["Tech", "IT Services"]),
                "growth_score": doc.get("growth_score", 8.0)
            })
    return tracks


# ------------------ Route ------------------
@router.get("/")
async def get_career_pathways(user: dict = Depends(get_current_user)):
    user_id = user["_id"]

    # Fetch profile
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(404, "User not found")

    user_skills = user_doc.get("skills", [])
    learning_goals = user_doc.get("learning_goals", [])

    # Fetch projects
    projects = await projects_collection.find({"user_id": ObjectId(user_id)}).to_list(length=100)
    project_domains = [p.get("domain", p.get("title", "")).lower() for p in projects]

    # Combine keywords
    user_keywords = list(set([*user_skills, *learning_goals, *project_domains]))
    if not user_keywords:
        raise HTTPException(400, "No skills, goals, or projects found in profile")

    # Suggest career tracks dynamically
    suggested_tracks = await suggest_career_tracks(user_keywords)
    if not suggested_tracks:
        raise HTTPException(404, "No career pathways could be generated")

    # Compute alignment
    recommendations = []
    for track in suggested_tracks:
        result = compute_alignment(user_keywords, track.get("core_skills", []))
        recommendations.append({
            "title": track.get("title"),
            "description": track.get("description"),
            "industries": track.get("industries", []),
            "alignment_score": result["alignment_score"],
            "growth_score": track.get("growth_score", 8.0),
            "recommended_skills": result["missing_skills"]
        })

    # Sort
    recommendations.sort(key=lambda x: (x["alignment_score"], x["growth_score"]), reverse=True)

    # Save to DB
    await career_pathways_collection.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": {"user_id": ObjectId(user_id), "pathways": recommendations}},
        upsert=True
    )

    return {"pathways": recommendations, "message": "Career pathways generated dynamically."}
