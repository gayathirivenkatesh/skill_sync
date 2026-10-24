from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import (
    skills_collection,
    learning_collection,
)
from routes.user_routes import get_current_user
import httpx
import os
import datetime
import urllib.parse

router = APIRouter(prefix="/api/learning", tags=["Learning Hub"])

SERPAPI_KEY = os.getenv("SERPAPI_API_KEY")
SERPAPI_URL = "https://serpapi.com/search.json"
HUGGINGFACE_API = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

PLATFORMS = ["coursera.org", "udemy.com", "youtube.com", "edx.org"]

# ------------------------------------------------------------------
# 1️⃣ EXISTING: AI-ENHANCED LEARNING RESOURCES (UNCHANGED)
# ------------------------------------------------------------------

@router.get("/resources")
async def get_learning_resources(user=Depends(get_current_user)):
    """
    Returns a smart learning plan based on user's skills.
    Never throws 404 for empty skills (better UX).
    """

    user_id = ObjectId(user["_id"])

    skills_doc = await skills_collection.find_one({"user_id": user_id})

    # ✅ Return empty learning plan instead of 404
    if not skills_doc or not skills_doc.get("skills"):
        return {
            "learning_plan": [],
            "message": "No skills found. Please add skills to generate learning resources."
        }

    skills = skills_doc["skills"]
    learning_plan = []

    async with httpx.AsyncClient() as client:
        for skill in skills:
            try:
                query = (
                    f"Best {skill} online course OR tutorial "
                    f"site:{' OR site:'.join(PLATFORMS)}"
                )

                response = await client.get(
                    SERPAPI_URL,
                    params={
                        "engine": "google",
                        "q": query,
                        "num": 5,
                        "hl": "en",
                        "gl": "us",
                        "tbs": "qdr:y",
                        "api_key": SERPAPI_KEY,
                    },
                    timeout=10,
                )

                data = response.json()
                resources = []
                combined_text = ""

                for item in data.get("organic_results", []):
                    title = item.get("title", "Untitled")
                    link = item.get("link", "#")

                    combined_text += title + " "

                    resources.append({
                        "title": title,
                        "url": link,
                        "skill": skill,
                        "status": "Not Started",
                        "source": "SerpAPI",
                        "fetched_at": datetime.datetime.utcnow().isoformat(),
                    })

                # 🔁 Fallback if no results
                if not resources:
                    resources = [{
                        "title": f"Learn {skill} (Manual Search)",
                        "url": f"https://www.google.com/search?q={skill}+course",
                        "skill": skill,
                        "status": "Not Started",
                        "source": "Fallback",
                    }]

                # 🧠 AI Summary
                summary_text = f"Explore these resources to learn {skill}."

                try:
                    summarizer_resp = await client.post(
                        HUGGINGFACE_API,
                        json={
                            "inputs": f"Summarize learning resources for {skill}: {combined_text}"
                        },
                        timeout=20,
                    )
                    summary_data = summarizer_resp.json()
                    if isinstance(summary_data, list):
                        summary_text = summary_data[0].get("summary_text", summary_text)
                except:
                    pass

                learning_plan.append({
                    "skill": skill,
                    "summary": summary_text,
                    "resources": resources,
                })

                # 💾 Save to DB
                # 💾 Save or update (prevents duplicates)
                await learning_collection.update_one(
                    {"user_id": user_id, "skill": skill},   # match same user + skill
                    {
                        "$set": {
                            "summary": summary_text,
                            "resources": resources,
                            "fetched_at": datetime.datetime.utcnow().isoformat(),
                        }
                    },
                    upsert=True,
                )


            except Exception as e:
                print("Learning fetch error:", e)
                learning_plan.append({
                    "skill": skill,
                    "summary": f"Manual search recommended for {skill}",
                    "resources": [],
                })

    return {"learning_plan": learning_plan}
# ------------------------------------------------------------------
#  STUDENT SKILL GAP ROUTE (MENTOR → STUDENT)
# ------------------------------------------------------------------

@router.get("/my-skill-gaps")
async def my_skill_gaps(user=Depends(get_current_user)):
    role = user.get("role", "").strip().lower().replace("_", " ")
    if role not in ["student", "team member"]:
        raise HTTPException(status_code=403)

    user_id = str(user["_id"])

    # ---------------- Student Skills ----------------
    skill_doc = await skills_collection.find_one({"user_id": ObjectId(user_id)})
    current_skills = set(
        s.strip().lower() for s in skill_doc.get("skills", []) if s
    ) if skill_doc else set()

    # ---------------- Trending Skills ----------------
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            "https://api.stackexchange.com/2.3/tags",
            params={"order": "desc", "sort": "popular", "site": "stackoverflow", "pagesize": 30}
        )
    if res.status_code != 200:
        raise HTTPException(500, "Failed to fetch trending skills")

    trending_skills = [tag["name"].replace("-", " ").lower() for tag in res.json().get("items", [])]

    # ---------------- Missing Skills ----------------
    missing_skills = [s for s in trending_skills if s not in current_skills][:10]

    # Build learning resources
    missing_with_resources = []
    for skill in missing_skills:
        query = urllib.parse.quote(f"learn {skill} programming")
        missing_with_resources.append({
            "skill_name": skill,
            "learning_resources": {
                "google": f"https://www.google.com/search?q={query}",
                "youtube": f"https://www.youtube.com/results?search_query={query}"
            }
        })

    return {
        "current_skills": sorted(list(current_skills)),
        "missing_skills": missing_with_resources
    }