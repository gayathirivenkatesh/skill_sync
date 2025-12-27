from fastapi import APIRouter, Depends, HTTPException, Body
from bson import ObjectId
from pydantic import BaseModel,validator
from typing import List,Optional
from datetime import datetime
import httpx
from database import (
    teams_collection,
    submissions_collection,
    users_collection,
    plagiarism_collection,
    team_files_collection,
    sessions_collection,
    skills_collection
)
from routes.user_routes import get_current_user
import urllib.parse
router = APIRouter(prefix="/mentor", tags=["Mentor"])

# ======================================================
# DASHBOARD STATS
# ======================================================
@router.get("/dashboard-stats")
async def mentor_dashboard_stats(user=Depends(get_current_user)):
    if user["role"] != "mentor":
        raise HTTPException(status_code=403)

    mentor_id = user["_id"]

    # Get all teams assigned to this mentor
    teams = await teams_collection.find({"mentor_id": mentor_id}).to_list(None)
    team_ids = [str(t["_id"]) for t in teams]

    mentees = set()
    for t in teams:
        for m in t.get("members", []):
            mentees.add(m["id"])

    sessions = await submissions_collection.count_documents({
        "team_id": {"$in": team_ids}
    })

    # ✅ Only consider plagiarism linked to actual submissions for this mentor
    plagiarism_alerts = 0
    if team_ids:
        for team_id in team_ids:
            # Get the latest submission for the team
            submission = await submissions_collection.find_one(
                {"team_id": team_id},
                sort=[("created_at", -1)]
            )
            if submission:
                # Check plagiarism linked to that submission
                plagiarism = await plagiarism_collection.find_one(
                    {"submission_id": submission["_id"], "score": {"$gte": 70}}
                )
                if plagiarism:
                    plagiarism_alerts += 1

    return {
        "totalTeams": len(teams),
        "totalMentees": len(mentees),
        "totalSessions": sessions,
        "plagiarismAlerts": plagiarism_alerts
    }
# ---------------- Get all mentees ----------------
@router.get("/my-mentees")
async def get_my_mentees(current_user=Depends(get_current_user)):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_id = str(current_user["_id"])

    # 1️⃣ Find all teams assigned to this mentor
    teams = await teams_collection.find({"mentor_id": mentor_id}).to_list(None)
    mentees = []

    # 2️⃣ Extract individual members
    for team in teams:
        for m in team.get("members", []):
            # Only include unique mentees
            if not any(existing["id"] == m["id"] for existing in mentees):
                # Fetch user details
                user = await users_collection.find_one({"_id": ObjectId(m["id"])})
                submissions_count = await submissions_collection.count_documents({"team_id": str(team["_id"])})
                mentees.append({
                    "id": m["id"],
                    "name": user.get("name") if user else "Unknown",
                    "email": user.get("email") if user else "",
                    "team_id": str(team["_id"]),
                    "team_name": team.get("team_name"),
                    "submissions_count": submissions_count,
                    "last_submission_date": team.get("last_submission_date")
                })

    return {"mentees": mentees}

@router.get("/skill-gaps/{team_id}")
async def skill_gap_analyzer(team_id: str, user=Depends(get_current_user)):
    if user["role"] != "mentor":
        raise HTTPException(status_code=403)

    # ---------------- Team ----------------
    team = await teams_collection.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(404, "Team not found")

    members = team.get("members", [])
    if not members:
        return {"team_name": team["team_name"], "trending_skills": [], "skill_gaps": []}

    # ✅ handle id / _id safely
    mentee_ids = []
    for m in members:
        raw_id = m.get("id") or m.get("_id")
        if raw_id:
            mentee_ids.append(ObjectId(raw_id))

    # ---------------- Users ----------------
    users = await users_collection.find(
        {"_id": {"$in": mentee_ids}},
        {"full_name": 1}
    ).to_list(None)

    # map both ObjectId + string
    user_map = {}
    for u in users:
        user_map[str(u["_id"])] = u.get("full_name", "Unknown")

    # ---------------- Skills ----------------
    skill_docs = await skills_collection.find(
        {
            "$or": [
                {"user_id": {"$in": list(user_map.keys())}},
                {"user_id": {"$in": mentee_ids}}
            ]
        }
    ).to_list(None)

    user_skills = {}
    for doc in skill_docs:
        uid = str(doc["user_id"])
        normalized = {
            s.strip().lower()
            for s in doc.get("skills", [])
            if s
        }
        user_skills.setdefault(uid, set()).update(normalized)

    # ---------------- Trending Skills ----------------
    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(
            "https://api.stackexchange.com/2.3/tags",
            params={
                "order": "desc",
                "sort": "popular",
                "site": "stackoverflow",
                "pagesize": 30
            }
        )

    if res.status_code != 200:
        raise HTTPException(500, "Failed to fetch trending skills")

    trending_skills = [
        tag["name"].replace("-", " ").lower()
        for tag in res.json().get("items", [])
    ]

    # ---------------- Build Gaps with dynamic learning resources ----------------
    skill_gaps = []

    for uid, name in user_map.items():
        current = sorted(user_skills.get(uid, []))
        missing = [s for s in trending_skills if s not in current][:10]

        # Add dynamic Google & YouTube learning links
        missing_with_resource = []
        for skill in missing:
            query = urllib.parse.quote(f"learn {skill} programming")
            google_link = f"https://www.google.com/search?q={query}"
            youtube_link = f"https://www.youtube.com/results?search_query={query}"
            missing_with_resource.append({
                "skill_name": skill,
                "learning_resources": {
                    "google": google_link,
                    "youtube": youtube_link
                }
            })


        skill_gaps.append({
            "mentee_id": uid,
            "mentee_name": name,
            "current_skills": current,
            "missing_skills": missing[:10]
        })

    return {
        "team_name": team["team_name"],
        "trending_skills": trending_skills[:15],
        "skill_gaps": skill_gaps
    }

@router.get("/plagiarism")
async def mentor_plagiarism(user=Depends(get_current_user)):
    if user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_id = str(user["_id"])
    
    # Fetch teams assigned to mentor
    teams = await teams_collection.find({"mentor_id": mentor_id}).to_list(None)
    team_ids = [str(t["_id"]) for t in teams]

    # Fetch latest plagiarism result for each team
    results = []
    for tid in team_ids:
        plagiarism_list = await plagiarism_collection.find(
            {"team_id": tid}
        ).sort("checked_at", -1).limit(1).to_list(1)

        plagiarism = plagiarism_list[0] if plagiarism_list else None
        team = next((t for t in teams if str(t["_id"]) == tid), None)
        results.append({
            "team_id": tid,
            "team_name": team.get("team_name") if team else "Unknown",
            "members_count": len(team.get("members", [])) if team else 0,
            "similarity": plagiarism.get("score") if plagiarism else 0,
            "status": plagiarism.get("status") if plagiarism else "Not checked"
        })

    return {"teams": results}

# ======================================================
# PENDING REVIEWS LIST
# ======================================================
@router.get("/reviews")
async def pending_reviews(user=Depends(get_current_user)):
    if user["role"] != "mentor":
        raise HTTPException(status_code=403)

    mentor_id = str(user["_id"])

    # Fetch teams where mentor_id or requested_mentor_id matches and review_status is "submitted"
    teams = await teams_collection.find({
        "$or": [
            {"mentor_id": mentor_id},
            {"requested_mentor_id": mentor_id}
        ],
        "review_status": "submitted"
    }).to_list(None)

    return {
        "teams": [
            {
                "team_id": str(t["_id"]),
                "team_name": t.get("team_name"),
                "creator_name": t.get("creator_name"),
                "submitted_at": t.get("submitted_at")
            }
            for t in teams
        ]
    }

# ======================================================
# TEAM REVIEW DETAIL (MentorTeamView)
# ======================================================
@router.get("/team/{team_id}")
async def mentor_team_view(team_id: str, user=Depends(get_current_user)):
    if user["role"] != "mentor":
        raise HTTPException(403, "Access denied")

    # Fetch team
    try:
        tid = ObjectId(team_id)
    except:
        raise HTTPException(400, "Invalid team ID")

    team = await teams_collection.find_one({"_id": tid})
    if not team:
        raise HTTPException(404, "Team not found")

    mentor_id = str(user["_id"])
    if mentor_id not in [team.get("mentor_id"), team.get("requested_mentor_id")]:
        raise HTTPException(403, "You are not assigned to this team")

    # Get latest submission
    submission_list = await submissions_collection.find(
        {"team_id": team_id}
    ).sort("submitted_at", -1).limit(1).to_list(1)

    submission = submission_list[0] if submission_list else {}

    # Attach uploaded files from team_files_collection
    files = []
    async for f in team_files_collection.find({"team_id": team_id}):
        files.append({
            "filename": f["filename"],
            "url": f["url"]
        })
    submission["files"] = files
    submission["_id"] = str(submission.get("_id", ""))

    # Attach plagiarism info if exists
    plagiarism = None
    submission_id = submission.get("_id")
    if submission_id:
        plagiarism_list = await plagiarism_collection.find(
            {"submission_id": submission_id}  # <-- string
        ).sort("checked_at", -1).limit(1).to_list(1)
        plagiarism = plagiarism_list[0] if plagiarism_list else None
        if plagiarism:
            plagiarism["_id"] = str(plagiarism["_id"])

    # Prepare response
    return {
        "team": {
            "team_id": team_id,
            "team_name": team.get("team_name"),
            "mentor_name": team.get("mentor_name"),
            "review_status": team.get("review_status"),
            "project_meta": team.get("project_meta", {})  # Project overview visible to mentor
        },
        "submission": submission,
        "plagiarism": plagiarism
    }

# ======================================================
# SAVE RUBRIC (Mentor Scoring)
# ======================================================
@router.post("/team/rubric/{team_id}")
async def save_rubric(team_id: str, rubric: dict = Body(...), user=Depends(get_current_user)):
    if user["role"] != "mentor":
        raise HTTPException(403)

    submission_list = await submissions_collection.find(
        {"team_id": team_id}
    ).sort("created_at", -1).limit(1).to_list(1)

    if not submission_list:
        raise HTTPException(400, "No submission")

    submission = submission_list[0]
    final_score = sum(int(v) for v in rubric.values())

    await submissions_collection.update_one(
        {"_id": submission["_id"]},
        {"$set": {
            "rubric": rubric,
            "final_score": final_score,
            "graded_at": datetime.utcnow()
        }}
    )

    return {"final_score": final_score}

# ======================================================
# APPROVE / REJECT SUBMISSION
# ======================================================
@router.post("/review/{team_id}")
async def mentor_decision(team_id: str, body: dict, user=Depends(get_current_user)):
    if user["role"] != "mentor":
        raise HTTPException(403)

    mentor_id = str(user["_id"])
    decision = body.get("status")
    feedback = body.get("feedback", "")

    team = await teams_collection.find_one({
        "_id": ObjectId(team_id),
        "$or": [
            {"requested_mentor_id": mentor_id},
            {"mentor_id": mentor_id}
        ]
    })

    if not team:
        raise HTTPException(404)

    if decision == "approved":
        update = {
            "review_status": "approved",
            "mentor_id": mentor_id,
            "mentor_feedback": feedback,
            "reviewed_at": datetime.utcnow(),
            "files_locked": True
        }
    elif decision == "rejected":
        update = {
            "review_status": "rejected",
            "mentor_feedback": feedback,
            "files_locked": False
        }
    else:
        raise HTTPException(400)

    await teams_collection.update_one(
        {"_id": ObjectId(team_id)},
        {"$set": update}
    )

    return {"success": True}



@router.get("/my-teams")
async def get_my_teams(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_id = str(current_user["_id"])

    teams_cursor = teams_collection.find({"mentor_id": mentor_id})
    teams_list = await teams_cursor.to_list(None)

    # Convert _id to string for frontend
    result = []
    for t in teams_list:
        result.append({
            "team_id": str(t["_id"]),
            "team_name": t.get("team_name"),
            "creator_name": t.get("creator_name"),
            "review_status": t.get("review_status"),
            "members": t.get("members", []),
        })

    return {"teams": result}

class MentorNotesRequest(BaseModel):
    notes: str


# ============================
# SAVE / UPDATE MENTOR NOTES
# ============================
@router.post("/notes/{team_id}")
async def save_mentor_notes(
    team_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    notes = payload.get("notes", "").strip()
    if not notes:
        raise HTTPException(status_code=400, detail="Notes cannot be empty")

    result = await teams_collection.update_one(
        {"_id": ObjectId(team_id), "mentor_id": current_user["_id"]},
        {"$set": {"mentor_notes": notes}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")

    return {"message": "Mentor notes saved"}


# ============================
# GET MENTOR NOTES
# ============================
@router.get("/notes/{team_id}")
async def get_mentor_notes(
    team_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    # ✅ FIX: await is REQUIRED
    team = await teams_collection.find_one(
        {"_id": ObjectId(team_id), "mentor_id": current_user["_id"]}
    )

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return {
        "notes": team.get("mentor_notes", "")
    }

# -------------------- Pydantic Models --------------------
class SessionCreate(BaseModel):
    datetime: datetime
    link: Optional[str] = None

    @validator("link")
    def empty_string_to_none(cls, v):
        if v == "":
            return None
        return v

class SessionOut(BaseModel):
    id: str
    team_id: str
    team_name: str
    mentor_id: str
    datetime: datetime
    status: str
    link: Optional[str] = None

# -------------------- Schedule a Session --------------------
@router.post("/sessions/{team_id}", response_model=SessionOut)
async def schedule_session(team_id: str, payload: SessionCreate, user=Depends(get_current_user)):
    if user.get("role") != "mentor":
        raise HTTPException(403, "Access denied")

    mentor_id = str(user["_id"])

    # Validate team ID
    try:
        tid = ObjectId(team_id)
    except:
        raise HTTPException(400, "Invalid team ID")

    team = await teams_collection.find_one({"_id": tid})
    if not team:
        raise HTTPException(404, "Team not found")

    if str(team.get("mentor_id")) != mentor_id:
        raise HTTPException(403, "You are not assigned to this team")

    session_doc = {
        "team_id": team_id,
        "mentor_id": mentor_id,
        "datetime": payload.datetime,
        "link": payload.link,
        "status": "upcoming"
    }

    result = await sessions_collection.insert_one(session_doc)
    session_doc["_id"] = str(result.inserted_id)

    return SessionOut(
        id=session_doc["_id"],
        team_id=team_id,
        team_name=team.get("team_name", "Unknown Team"),
        mentor_id=mentor_id,
        datetime=session_doc["datetime"],
        status=session_doc["status"],
        link=session_doc.get("link")
    )

# -------------------- Get Mentor Sessions --------------------
@router.get("/sessions")
async def get_mentor_sessions(current_user: dict = Depends(get_current_user)):
    # Only mentors can access
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        mentor_id = str(current_user["_id"])

        # Async fetch from MongoDB using motor
        sessions_cursor = sessions_collection.find({"mentor_id": mentor_id})
        sessions_list = await sessions_cursor.to_list(length=None)

        # Convert ObjectId and prepare status
        sessions = []
        for s in sessions_list:
            sessions.append({
                "id": str(s["_id"]),
                "team_id": str(s.get("team_id", "")),
                "team_name": s.get("team_name", "Unknown Team"),
                "mentor_id": s.get("mentor_id", ""),
                "datetime": s.get("datetime"),
                "status": "upcoming" if s.get("datetime") > datetime.utcnow() else "completed",
                "link": s.get("link")
            })

        return {"sessions": sessions}

    except Exception as e:
        # Print for debugging
        print("Error fetching sessions:", e)
        raise HTTPException(status_code=500, detail="Internal server error")
