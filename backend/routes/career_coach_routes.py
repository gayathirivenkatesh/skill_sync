from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import users_collection, career_coach_collection
from routes.user_routes import get_current_user
from datetime import datetime
import google.generativeai as genai
import os

router = APIRouter(prefix="/api/careercoach", tags=["Career Coach"])

# ------------------ Configure Gemini ------------------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# ---------------------- Generate Career Insights ----------------------
@router.get("/insights")
async def get_career_insights(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    user = await users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    name = user.get("name", "Learner")
    skills = user.get("skills", ["Python", "C", "Machine Learning"])
    interests = user.get("interests", ["AI", "Web Development"])
    goals = user.get("goals", "Exploring career options")
    experience = user.get("experience", "Beginner")

    prompt = f"""
You are a friendly and realistic AI Career Coach.
User Profile:
- Name: {name}
- Experience: {experience}
- Skills: {', '.join(skills)}
- Interests: {', '.join(interests)}
- Goal: {goals}

Respond ONLY in this format:
---
👋 Hi {name}!

💼 **Career Readiness Score:** (number between 60–100%)

1️⃣ **Top 3 Strengths:**
• (strength 1)
• (strength 2)
• (strength 3)

2️⃣ **Top 3 Areas to Improve:**
• (area 1)
• (area 2)
• (area 3)

💬 **Motivational Quote:**
"(short and inspiring quote under 15 words)"
---
"""

    try:
        result = model.generate_content(prompt)
        ai_message = result.text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

    readiness_score = min(100, 60 + len(skills) * 3)

    insight_entry = {
        "user_id": str(user_id),
        "name": name,
        "timestamp": datetime.utcnow(),
        "skills": skills,
        "interests": interests,
        "goals": goals,
        "ai_message": ai_message,
        "readiness_score": readiness_score,
    }

    await career_coach_collection.insert_one(insight_entry)

    return {
        "user_name": name,
        "ai_message": ai_message,
        "readiness_score": readiness_score,
        "timestamp": insight_entry["timestamp"],
    }


# ---------------------- Career Timeline ----------------------
@router.get("/timeline")
async def get_career_timeline(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    insights = await career_coach_collection.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).to_list(None)

    for i in insights:
        i["_id"] = str(i["_id"])
        i["timestamp"] = i["timestamp"].strftime("%Y-%m-%d %H:%M:%S")

    return {"total_sessions": len(insights), "timeline": insights}
