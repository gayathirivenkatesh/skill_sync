from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import teams_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/mentor", tags=["Mentor"])

PLAGIARISM_THRESHOLD = 70  # Define threshold

@router.get("/plagiarism")
async def mentor_plagiarism_alerts(current_user: dict = Depends(get_current_user)):
    """
    Returns all teams assigned to the mentor with plagiarism info.
    Only returns teams where plagiarism score >= threshold.
    """
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch all teams for this mentor
    cursor = teams_collection.find({"mentor_id": current_user["_id"]})
    teams = await cursor.to_list(length=100)

    alerts = []
    for team in teams:
        plagiarism = team.get("plagiarism", {})
        score = plagiarism.get("score", 0)
        if score >= PLAGIARISM_THRESHOLD:
            alerts.append({
                "team_id": str(team["_id"]),
                "team_name": team.get("team_name", "Unknown"),
                "score": score,
                "files": team.get("submission", {}).get("files", [])
            })

    return {
        "threshold": PLAGIARISM_THRESHOLD,
        "alerts": alerts
    }
@router.get("/plagiarism/{team_id}")
async def mentor_team_plagiarism(team_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    if not ObjectId.is_valid(team_id):
        raise HTTPException(status_code=400, detail="Invalid team ID")

    team = await teams_collection.find_one({"_id": ObjectId(team_id), "mentor_id": current_user["_id"]})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return {
        "team_name": team.get("team_name", "Unknown"),
        "plagiarism": team.get("plagiarism", {}),
        "files": team.get("submission", {}).get("files", [])
    }
