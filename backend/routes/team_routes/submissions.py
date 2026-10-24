from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from routes.user_routes import get_current_user
from database import submissions_collection, teams_collection, team_files_collection

router = APIRouter()

# ===================== SUBMISSION =====================
@router.post("/submit-review/{team_id}")
async def submit_review(team_id: str, user=Depends(get_current_user)):
    # Fetch team
    team = await teams_collection.find_one({"_id": ObjectId(team_id)})
    if not team:
        raise HTTPException(404, "Team not found")

    # Only creator can submit
    if str(team.get("creator_id")) != str(user["_id"]):
        raise HTTPException(403, "Only the team creator can submit")

    # Fetch uploaded files from team_files_collection
    uploaded_files = []
    async for f in team_files_collection.find({"team_id": team_id}):
        uploaded_files.append({
            "filename": f["filename"],
            "url": f["url"]
        })

    if not uploaded_files:
        raise HTTPException(400, "No files uploaded yet")

    # Check resubmission
    review_status = team.get("review_status", "not_submitted")
    resubmission_count = team.get("resubmission_count", 0)
    if review_status == "rejected" and resubmission_count >= 3:
        raise HTTPException(403, "Resubmission limit reached (3 attempts)")

    # Update team status
    update_fields = {
        "review_status": "submitted",
        "files_locked": True
    }
    if review_status == "rejected":
        update_fields["resubmission_count"] = resubmission_count + 1

    await teams_collection.update_one({"_id": ObjectId(team_id)}, {"$set": update_fields})

    # Determine submission version
    last_submission = await submissions_collection.find_one(
        {"team_id": team_id},
        sort=[("version", -1)]
    )
    version = last_submission["version"] + 1 if last_submission else 1

    # Insert submission document
    submission_doc = {
        "team_id": team_id,
        "version": version,
        "status": "submitted",
        "files": uploaded_files,
        "submitted_at": datetime.utcnow(),
        "mentor_feedback": None,
        "final_score": None,
        "rubric": None
    }

    await submissions_collection.insert_one(submission_doc)

    return {
        "team_id": str(team["_id"]),
        "review_status": "submitted",
        "resubmission_count": update_fields.get("resubmission_count", resubmission_count),
        "files_submitted": uploaded_files
    }

@router.get("/submissions/{team_id}")
async def submissions(team_id: str, user=Depends(get_current_user)):
    subs = []
    async for s in submissions_collection.find(
        {"team_id": team_id}
    ).sort("submitted_at", -1):
        subs.append({
            "id": str(s["_id"]),
            "version": s["version"],
            "status": s["status"],
            "files": s.get("files", []),
            "rubric": s.get("rubric"),
            "final_score": s.get("final_score"),
            "mentor_feedback": s.get("mentor_feedback"),
            "submitted_at": s["submitted_at"]
        })
    return {"submissions": subs}

