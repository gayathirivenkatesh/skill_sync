# routes/mentor_announcements.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from bson import ObjectId
from database import announcements_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/mentor/announcements", tags=["Mentor Announcements"])


class AnnouncementRequest(BaseModel):
    title: str
    content: str


class CommentRequest(BaseModel):
    announcement_id: str
    content: str


# ---------------- ADD ANNOUNCEMENT ----------------
@router.post("/add")
async def add_announcement(data: AnnouncementRequest, current_user=Depends(get_current_user)):

    doc = {
        "title": data.title.strip(),
        "content": data.content.strip(),
        "created_by_id": str(current_user["_id"]),
        "created_by_name": current_user.get("name", "Mentor"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "comments": []
    }

    res = await announcements_collection.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    # mark as owner for frontend
    doc["is_owner"] = True

    return doc


# ---------------- ADD COMMENT ----------------
@router.post("/comment")
async def add_comment(data: CommentRequest, current_user=Depends(get_current_user)):

    comment_id = str(ObjectId())

    comment = {
        "comment_id": comment_id,
        "user_id": str(current_user["_id"]),
        "user_name": current_user.get("name", "Mentor"),
        "content": data.content.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await announcements_collection.update_one(
        {"_id": ObjectId(data.announcement_id)},
        {"$push": {"comments": comment}}
    )

    # add ownership property before sending back
    comment["is_owner"] = True
    return comment


# ---------------- GET ALL ----------------
@router.get("/")
async def get_announcements(current_user=Depends(get_current_user)):

    user_id = str(current_user["_id"])

    results = []
    async for a in announcements_collection.find().sort("created_at", -1):

        a["_id"] = str(a["_id"])

        # owner for announcements
        a["is_owner"] = (a.get("created_by_id") == user_id)

        # owner flag for each comment
        for c in a.get("comments", []):
            c["is_owner"] = (c.get("user_id") == user_id)

        results.append(a)

    return {"announcements": results}


# ---------------- DELETE ANNOUNCEMENT ----------------
@router.delete("/delete/{announcement_id}")
async def delete_announcement(announcement_id: str, current_user=Depends(get_current_user)):

    user_id = str(current_user["_id"])

    doc = await announcements_collection.find_one({"_id": ObjectId(announcement_id)})

    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    if doc.get("created_by_id") != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    await announcements_collection.delete_one({"_id": ObjectId(announcement_id)})

    return {"status": "deleted"}


# ---------------- DELETE COMMENT ----------------
@router.delete("/comment/{announcement_id}/{comment_id}")
async def delete_comment(announcement_id: str, comment_id: str, current_user=Depends(get_current_user)):

    user_id = str(current_user["_id"])

    announcement = await announcements_collection.find_one({"_id": ObjectId(announcement_id)})

    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # ensure the logged user owns the comment
    comments = announcement.get("comments", [])
    target = next((c for c in comments if c.get("comment_id") == comment_id), None)

    if not target:
        raise HTTPException(status_code=404, detail="Comment not found")

    if target.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    await announcements_collection.update_one(
        {"_id": ObjectId(announcement_id)},
        {"$pull": {"comments": {"comment_id": comment_id}}}
    )

    return {"status": "deleted"}
