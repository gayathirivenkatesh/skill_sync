from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os, re
from datetime import datetime
from database import users_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/future-story", tags=["Future Story"])

# ---------------- Gemini Setup ----------------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# ---------------- Models ----------------

class StoryRequest(BaseModel):
    interest_role: str
    dream_company_type: str
    time_horizon: str
    current_struggle: str


class StoryPayload(BaseModel):
    story: str
    action_steps: list[str]
    motivation_line: str
    created_at: str


class StoryEnvelope(BaseModel):
    status: str          # "empty" | "generated"
    data: StoryPayload | None


# ---------------- Generate & Save Story ----------------

@router.post("/generate", response_model=StoryEnvelope)
async def generate_story(
    data: StoryRequest,
    current_user: dict = Depends(get_current_user)
):
    name = current_user.get("name", "Student")

    prompt = f"""
Write output in EXACTLY this format:

STORY:
<short motivational story written in second person>

STEPS:
- step 1
- step 2
- step 3
- step 4
- step 5

MOTIVATION:
<one powerful motivational line>

Student:
Name: {name}
Role: {data.interest_role}
Company Type: {data.dream_company_type}
Time: {data.time_horizon}
Struggle: {data.current_struggle}

Tone:
- realistic
- motivating
- grounded
"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        story_match = re.search(r"STORY:(.*)STEPS:", text, re.S)
        steps_match = re.search(r"STEPS:(.*)MOTIVATION:", text, re.S)
        motivation_match = re.search(r"MOTIVATION:(.*)", text, re.S)

        if not (story_match and steps_match and motivation_match):
            raise ValueError("Invalid AI format")

        payload = {
            "story": story_match.group(1).strip(),
            "action_steps": [
                s.strip("- ").strip()
                for s in steps_match.group(1).splitlines()
                if s.strip().startswith("-")
            ][:5],
            "motivation_line": motivation_match.group(1).strip(),
            "created_at": datetime.utcnow().isoformat()
        }

        await users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"future_story": payload}}
        )

        return {
            "status": "generated",
            "data": payload
        }

    except Exception as e:
        print("Future Story Error:", e)
        raise HTTPException(status_code=500, detail="Story generation failed")


# ---------------- Fetch Story (404-FREE) ----------------

@router.get("/me", response_model=StoryEnvelope)
async def get_my_story(
    current_user: dict = Depends(get_current_user)
):
    story = current_user.get("future_story")

    if not story:
        return {
            "status": "empty",
            "data": None
        }

    return {
        "status": "generated",
        "data": story
    }
