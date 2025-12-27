from fastapi import APIRouter, Depends
from bson import ObjectId
from database import projects_collection
from routes.user_routes import get_current_user

router = APIRouter()

# -------------------- Get Project Matches --------------------
@router.get("/matches")
async def get_project_matches(current_user: dict = Depends(get_current_user)):
    """
    Return projects matched to the current user's skills.
    """
    user_skills = set(current_user.get("skills", []))

    if not user_skills:
        return {"matches": []}

    # Fetch all projects from DB
    projects_cursor = projects_collection.find({})
    matches = []

    async for project in projects_cursor:
        required_skills = set(project.get("required_skills", []))
        # Intersection of user skills and project required skills
        score = len(user_skills.intersection(required_skills))
        if score > 0:
            project["_id"] = str(project["_id"])
            project["match_score"] = score
            matches.append(project)

    # Sort by highest skill match
    matches.sort(key=lambda x: x["match_score"], reverse=True)

    return {"matches": matches}
