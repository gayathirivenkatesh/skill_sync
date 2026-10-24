from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from routes.user_routes import get_current_user
from database import teams_collection,  users_collection, skill_gaps_collection, roles_collection, learning_collection, community_collection

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):

    user_id = ObjectId(current_user["_id"])

    # -------- skills count (array inside users doc) --------
    user_doc = await users_collection.find_one(
        {"_id": user_id},
        {"skills": 1, "learning_completed": 1, "xp": 1}
    )

    skills_array = user_doc.get("skills", []) if user_doc else []
    skills_count = len(skills_array)

    # -------- learning completed count --------
    learning_completed_list = user_doc.get("learning_completed", []) if user_doc else []
    learning_completed = len(learning_completed_list)

    # -------- gamification --------
    gamification_score = user_doc.get("xp", 0) if user_doc else 0

    # -------- total learning resources --------
    total_resources = await learning_collection.count_documents({})

    # -------- % learning progress --------
    if total_resources > 0:
        learning_progress_percent = round(
            (learning_completed / total_resources) * 100, 2
        )
    else:
        learning_progress_percent = 0

    return {
        "skills_count": skills_count,
        "learning_completed": learning_completed,
        "learning_progress_percent": learning_progress_percent,
        "gamification_score": gamification_score,
    }

from bson import ObjectId

@router.get("/learning-progress")
async def get_learning_progress(current_user: dict = Depends(get_current_user)):

    uid = str(current_user["_id"])
    uid_obj = ObjectId(uid)

    # ---------- gaps ----------
    gap_doc = await skill_gaps_collection.find_one(
        {"student_id": {"$in": [uid, uid_obj]}}
    ) or {}

    gaps_remaining = len(gap_doc.get("missing_skills", []))

    # ---------- skills learned ----------
    user_doc = await users_collection.find_one(
        {"_id": uid_obj},
        {"skills": 1}
    )

    skills_array = user_doc.get("skills", []) if user_doc else []
    learned_skills_count = len(skills_array)
    # ---------- resources ----------
    total_resources = await learning_collection.count_documents({})
    completed_resources = await learning_collection.count_documents(
        {"completed_by": {"$in": [uid, uid_obj]}}
    )

    # ---------- role ----------
    role_doc = await roles_collection.find_one(
        {"user_id": {"$in": [uid, uid_obj]}}
    ) or {}

    role_progress_percent = role_doc.get("progress", 0)

    # ---------- OVERALL PROGRESS ----------
    parts = []

    # role %
    parts.append(role_progress_percent)

    # resource completion %
    if total_resources > 0:
        parts.append((completed_resources / total_resources) * 100)

    # skill gap %
    if gaps_remaining >= 0:
        # assume fewer gaps = higher progress
        total_gaps = gaps_remaining + learned_skills_count
        if total_gaps > 0:
            gap_progress = (learned_skills_count / total_gaps) * 100
            parts.append(gap_progress)

    # final average %
    overall_progress = round(sum(parts) / len(parts), 2) if parts else 0

    return {
        "overall_progress": overall_progress,
        "gaps_remaining": gaps_remaining,
        "skills_learned": learned_skills_count,
        "completed_resources": completed_resources,
        "total_resources": total_resources,
        "role_progress_percent": role_progress_percent,
    }

# ----------------- Skill Distribution -----------------
@router.get("/skills-distribution")
async def skills_distribution(current_user: dict = Depends(get_current_user)):
    """
    Returns a skill heatmap / distribution for the user.
    """
    user_id = ObjectId(current_user["_id"])
    user_doc = await users_collection.find_one({"_id": user_id})

    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")

    skills = user_doc.get("skills", [])
    distribution = {skill: 1 for skill in skills}  # basic count, can extend to projects/teams

    return {"skill_distribution": distribution}

# ---------------- Fetch Teams for Current User ----------------
@router.get("/my-teams")
async def get_my_teams(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    cursor = teams_collection.find({
        "$or": [
            {"creator_id": user_id},
            {"members.id": user_id}
        ]
    })

    teams = []
    async for team in cursor:
        teams.append({
            "team_id": str(team["_id"]),
            "team_name": team["team_name"],
            "mentor_name": team.get("mentor_name"),
            "members": team.get("members", []),
            "team_size": team.get("team_size", 0),
            "required_skills": team.get("required_skills", []),
            "review_status": team.get("review_status", "not_submitted"),
            "project_phase": team.get("project_phase", "Discussion"),
        })

    return {"teams": teams}



# ============================
# 🧠 MENTOR DASHBOARD ROUTES
# ============================

@router.get("/mentor/dashboard/stats")
async def mentor_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_id = str(current_user["_id"])  # ✅ STRING (matches team schema)

    cursor = teams_collection.find({"mentor_id": mentor_id})

    active_projects = 0
    mentees_count = 0

    async for team in cursor:
        active_projects += 1
        mentees_count += len(team.get("members", []))

    return {
        "mentees_count": mentees_count,   # ✅ total students across teams
        "active_projects": active_projects,  # ✅ teams mentored
        "pending_reviews": 0  # placeholder for future
    }

@router.get("/mentor/dashboard/my-mentees")
async def mentor_my_mentees(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_id = ObjectId(current_user["_id"])

    cursor = users_collection.find(
        {"mentor_id": mentor_id},
        {"full_name": 1, "email": 1, "status": 1}
    )

    mentees = []
    async for user in cursor:
        mentees.append({
            "student_id": str(user["_id"]),
            "student_name": user.get("full_name"),
            "email": user.get("email"),
            "status": user.get("status", "active")
        })

    return {"mentees": mentees}


@router.get("/mentor/dashboard/recent-activity")
async def mentor_recent_activity(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_doc = await users_collection.find_one(
        {"_id": ObjectId(current_user["_id"])},
        {"activity": 1}
    )

    activity = mentor_doc.get("activity", []) if mentor_doc else []
    activity.sort(key=lambda x: x.get("time", ""), reverse=True)

    return {"activities": activity[:10]} 
