from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
from database import submissions_collection, teams_collection
from routes.user_routes import get_current_user

router = APIRouter()

# ===================== RUBRIC =====================

@router.post("/rubric/{team_id}")
async def save_rubric(
    team_id: str,
    rubric: dict,
    user=Depends(get_current_user)
):
    try:
        tid = ObjectId(team_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid team ID")

    team = await teams_collection.find_one({"_id": tid})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    user_id = str(user["_id"])
    mentor_id = str(team.get("mentor_id") or "")
    req_mentor_id = str(team.get("requested_mentor_id") or "")

    # 🔐 Only mentor assigned to this team can grade
    if user.get("role") != "mentor" or (user_id != mentor_id and user_id != req_mentor_id):
        raise HTTPException(status_code=403, detail="Only assigned mentor can grade")

    # 🔢 Clean rubric scores and calculate final score
    cleaned_rubric = {}
    for k, v in rubric.items():
        try:
            cleaned_rubric[k] = int(v)
        except (ValueError, TypeError):
            cleaned_rubric[k] = 0

    final_score = sum(cleaned_rubric.values())
    now = datetime.utcnow()

    # 1. Update team document in teams_collection
    await teams_collection.update_one(
        {"_id": tid},
        {
            "$set": {
                "rubric": cleaned_rubric,
                "final_score": final_score,
                "graded_at": now,
            }
        }
    )

    # 2. Update latest submission in submissions_collection
    latest_sub = await submissions_collection.find_one(
        {"team_id": team_id},
        sort=[("version", -1), ("submitted_at", -1)]
    )

    if latest_sub:
        await submissions_collection.update_one(
            {"_id": latest_sub["_id"]},
            {
                "$set": {
                    "rubric": cleaned_rubric,
                    "final_score": final_score,
                    "graded_at": now,
                }
            }
        )
    else:
        # Create an initial submission record if none exists yet
        await submissions_collection.insert_one({
            "team_id": team_id,
            "version": 1,
            "status": team.get("review_status", "submitted"),
            "files": [],
            "submitted_at": now,
            "mentor_feedback": team.get("mentor_feedback", ""),
            "rubric": cleaned_rubric,
            "final_score": final_score,
            "graded_at": now,
        })

    return {
        "final_score": final_score,
        "rubric": cleaned_rubric
    }

