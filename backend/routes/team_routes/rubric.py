from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from database import submissions_collection, teams_collection
from routes.user_routes import get_current_user

router = APIRouter()

class RubricRequest(BaseModel):
    problem: int
    implementation: int
    teamwork: int
    presentation: int

# ===================== RUBRIC =====================

@router.post("/rubric/{team_id}")
async def save_rubric(
    team_id: str,
    rubric: dict,
    user=Depends(get_current_user)
):
    team = await teams_collection.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(404, "Team not found")

    # 🔐 Only mentor can grade
    if team.get("mentor_id") != str(user["_id"]):
        raise HTTPException(403, "Only mentor can grade")

    # 🔢 Calculate final score
    final_score = sum(rubric.values())

    # 🔄 Update latest submission
    await submissions_collection.update_one(
        {"team_id": team_id},
        {
            "$set": {
                "rubric": rubric,
                "final_score": final_score,
                "graded_at": datetime.utcnow(),
            }
        }
    )

    return {
        "final_score": final_score
    }
