from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException       
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import re

from database import (
    users_collection,
    teams_collection,
    submissions_collection,
    plagiarism_collection,
    sessions_collection
)

from routes.user_routes import get_current_user

router = APIRouter()

class TeamRequest(BaseModel):
    team_name: str
    team_size: int
    required_skills: List[str]
    mentor_id: str

class ProjectMetaRequest(BaseModel):
    title: str
    problem_statement: str
    solution_summary: str
    tech_stack: List[str]
    github_repo: Optional[str] = None
    live_url: Optional[str] = None
    last_updated: Optional[datetime] = None
# ===================== MENTORS =====================

@router.get("/mentors")
async def get_mentors(user=Depends(get_current_user)):
    mentors = await users_collection.find(
        { "role": "mentor" },
        { "password": 0 }
    ).to_list(length=None)

    result = []

    for m in mentors:
        mentor_id = str(m["_id"])

        used_slots = await teams_collection.count_documents({
            "mentorId": mentor_id
        })

        result.append({
            "id": mentor_id,
            "full_name": m.get("full_name") or m.get("name"),
            "slotsLeft": max(0, 5 - used_slots)
        })

    return { "mentors": result }



# ===================== TEAM =====================

@router.post("/build-team")
async def build_team(req: TeamRequest, user=Depends(get_current_user)):
    mentor = await users_collection.find_one({
        "_id": ObjectId(req.mentor_id),
        "role": "mentor"
    })
    if not mentor:
        raise HTTPException(404, "Mentor not found")

    team = {
        "team_name": req.team_name,
        "creator_id": str(user["_id"]),
        "creator_name": user["full_name"],
        "mentor_id": req.mentor_id,
        "mentor_name": mentor["full_name"],
        "required_skills": req.required_skills,
        "team_size": req.team_size,
        "members": [{"id": str(user["_id"]), "full_name": user["full_name"]}],
        "review_status": "not_submitted",
        "created_at": datetime.utcnow()
    }

    await teams_collection.insert_one(team)
    return {"message": "Team created"}


@router.get("/my-teams")
async def my_teams(user=Depends(get_current_user)):
    uid = str(user["_id"])
    teams = []

    async for t in teams_collection.find({
        "$or": [{"creator_id": uid}, {"members.id": uid}]
    }):
        teams.append({
            "team_id": str(t["_id"]),
            "team_name": t["team_name"],
            "creator_id": t["creator_id"],
            "mentor_name": t["mentor_name"],
            "team_size": t["team_size"],
            "members": t["members"],
            "review_status": t["review_status"]
        })

    return {"teams": teams}

@router.get("/existing-teams")
async def existing_teams(user=Depends(get_current_user)):
    uid = str(user["_id"])
    teams = []

    async for t in teams_collection.find({
        "creator_id": {"$ne": uid},
        "members.id": {"$ne": uid},
    }):
        # ❌ skip full teams
        if len(t.get("members", [])) >= t.get("team_size", 0):
            continue

        teams.append({
            "team_id": str(t["_id"]),
            "team_name": t.get("team_name"),
            "mentor_name": t.get("mentor_name"),
            "team_size": t.get("team_size"),
            "members": t.get("members", []),
            "review_status": t.get("review_status", "not_submitted"),
        })

    return {"teams": teams}

@router.post("/join/{team_id}")
async def join_team(
    team_id: str,
    user=Depends(get_current_user)
):
    uid = str(user["_id"])

    team = await teams_collection.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # ❌ Creator cannot rejoin
    if team.get("creator_id") == uid:
        raise HTTPException(status_code=400, detail="You already own this team")

    # ❌ Already a member
    if any(m["id"] == uid for m in team.get("members", [])):
        raise HTTPException(status_code=400, detail="Already joined")

    # ❌ Team full
    if len(team.get("members", [])) >= team.get("team_size", 0):
        raise HTTPException(status_code=400, detail="Team is full")

    new_member = {
        "id": uid,
        "full_name": user.get("full_name"),
        "email": user.get("email"),
        "role": "member"
    }

    await teams_collection.update_one(
        {"_id": ObjectId(team_id)},
        {"$push": {"members": new_member}}
    )

    return {
        "message": "Joined team successfully",
        "team_id": team_id
    }

@router.get("/details/{team_id}")
async def team_details(team_id: str, user=Depends(get_current_user)):
    try:
        tid = ObjectId(team_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid team id")

    team = await teams_collection.find_one({"_id": tid})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    uid = str(user["_id"])

    # 🔐 Access control
    is_member = any(m["id"] == uid for m in team.get("members", []))
    is_creator = team.get("creator_id") == uid
    is_mentor = team.get("mentor_id") == uid

    if not (is_member or is_creator or is_mentor):
        raise HTTPException(status_code=403, detail="Access denied")

    # 🔹 Latest submission
    submission = await submissions_collection.find_one(
        {"team_id": team_id},
        sort=[("version", -1)]
    )

    # 🔹 Latest plagiarism
    plagiarism = await plagiarism_collection.find_one(
        {"team_id": team_id},
        sort=[("checked_at", -1)]
    )

    project_meta = team.get("project_meta", {})

    return {
        "team": {
            "id": str(team["_id"]),
            "team_name": team.get("team_name"),
            "mentor_name": team.get("mentor_name"),
            "mentor_id": team.get("mentor_id"),
            "creator_id": team.get("creator_id"),
            "members": team.get("members", []),
            "team_size": team.get("team_size"),
            "required_skills": team.get("required_skills", []),
            "review_status": team.get("review_status"),
            "created_at": team.get("created_at"),

            # 🔥 NEW: Project context for TeamSpace
            "project_meta": {
                "title": project_meta.get("title"),
                "problem_statement": project_meta.get("problem_statement"),
                "solution_summary": project_meta.get("solution_summary"),
                "tech_stack": project_meta.get("tech_stack", []),
                "github_repo": project_meta.get("github_repo"),
                "branch": project_meta.get("branch", "main"),
                "live_url": project_meta.get("live_url"),
                "api_docs": project_meta.get("api_docs"),
                "contributions": project_meta.get("contributions", []),
                "last_updated": project_meta.get("last_updated"),
            }
        },

        "submission": {
            "id": str(submission["_id"]),
            "version": submission.get("version"),
            "status": submission.get("status"),
            "rubric": submission.get("rubric", {}),
            "final_score": submission.get("final_score"),
            "mentor_feedback": submission.get("mentor_feedback", ""),
        } if submission else None,

        "plagiarism": {
            "score": plagiarism.get("score"),
            "status": plagiarism.get("status"),
            "checked_at": plagiarism.get("checked_at"),
        } if plagiarism else None
    }

@router.put("/project-meta/{team_id}")
async def update_project_meta(
    team_id: str,
    payload: ProjectMetaRequest,
    user=Depends(get_current_user)
):
    try:
        tid = ObjectId(team_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid team id")

    team = await teams_collection.find_one({"_id": tid})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # 🔐 Only creator can edit
    if team.get("creator_id") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Only creator can edit")

    # 🔒 Lock after submission
    if team.get("review_status") != "not_submitted":
        raise HTTPException(status_code=400, detail="Project locked")

    await teams_collection.update_one(
        {"_id": tid},
        {
            "$set": {
                "project_meta": payload.dict(),
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {"message": "Project details updated"}

# ----------------- Schemas -----------------
class SessionOut(BaseModel):
    id: str
    team_id: str
    team_name: str
    mentor_id: str
    datetime: datetime
    status: str  # "upcoming" or "completed"
    link: Optional[str] = None

# ----------------- Get sessions for a team -----------------
@router.get("/sessions/{team_id}")
async def get_team_sessions(team_id: str, current_user=Depends(get_current_user)):
    # Validate ObjectId
    try:
        tid = ObjectId(team_id)
    except:
        raise HTTPException(400, "Invalid team ID")

    # Fetch team
    team = await teams_collection.find_one({"_id": tid})
    if not team:
        raise HTTPException(404, "Team not found")

    # Check membership: allow creator or any member
    user_id = str(current_user["_id"])
    member_ids = [str(m["id"]) for m in team.get("members", [])]
    if user_id != str(team.get("creator_id")) and user_id not in member_ids:
        raise HTTPException(403, "Access denied")

    # Fetch sessions for this team
    sessions = await sessions_collection.find({"team_id": team_id}).to_list(None)

    # Convert ObjectIds to strings
    for s in sessions:
        s["_id"] = str(s["_id"])

    return sessions
