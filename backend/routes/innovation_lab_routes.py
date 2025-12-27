from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import List
from database import innovation_collection, users_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/innovation", tags=["Innovation Lab"])


# ---------- Helpers ----------
def to_str_id(oid):
    return str(oid) if isinstance(oid, ObjectId) else oid


def serialize_idea(idea: dict):
    """Convert MongoDB ObjectIds and datetime to JSON-safe types."""
    if not idea:
        return {}
    return {
        "id": str(idea.get("_id")),
        "title": idea.get("title"),
        "summary": idea.get("summary"),
        "details": idea.get("details", ""),
        "tags": idea.get("tags", []),
        "creator_id": str(idea.get("creator_id")) if idea.get("creator_id") else None,
        "creator_name": idea.get("creator_name", "Unknown"),
        "votes": idea.get("votes", 0),
        "created_at": idea.get("created_at").isoformat() if isinstance(idea.get("created_at"), datetime) else idea.get("created_at"),
        "status": idea.get("status", "idea"),
        "comments": [
            {
                "user_id": str(c.get("user_id")) if c.get("user_id") else None,
                "user_name": c.get("user_name", "User"),
                "text": c.get("text", ""),
                "timestamp": c.get("timestamp").isoformat() if isinstance(c.get("timestamp"), datetime) else c.get("timestamp"),
            }
            for c in idea.get("comments", [])
        ],
    }


# ---------- Endpoints ----------

@router.post("/ideas/create")
async def create_idea(payload: dict, user: dict = Depends(get_current_user)):
    """Create a new innovation idea."""
    title = (payload.get("title") or "").strip()
    summary = (payload.get("summary") or "").strip()
    details = payload.get("details", "")
    tags = payload.get("tags", [])

    if not title or not summary:
        raise HTTPException(status_code=400, detail="Title and summary required")

    idea_doc = {
        "title": title,
        "summary": summary,
        "details": details,
        "tags": [t.strip().lower() for t in tags if t.strip()],
        "creator_id": ObjectId(user["_id"]) if isinstance(user["_id"], str) else user["_id"],
        "creator_name": user.get("full_name", user.get("name", "Unknown")),
        "votes": 0,
        "voters": [],
        "comments": [],
        "created_at": datetime.now(ZoneInfo("UTC")),
        "status": "idea",
    }

    result = await innovation_collection.insert_one(idea_doc)
    new_idea = await innovation_collection.find_one({"_id": result.inserted_id})
    return serialize_idea(new_idea)


@router.get("/ideas")
async def list_ideas(tag: str = None, sort: str = "new", limit: int = 50):
    """List innovation ideas (optionally filtered by tag)."""
    query = {}
    if tag:
        query["tags"] = tag.lower()

    cursor = innovation_collection.find(query)
    if sort == "top":
        cursor = cursor.sort("votes", -1)
    else:
        cursor = cursor.sort("created_at", -1)

    ideas = await cursor.to_list(length=limit)
    return {"ideas": [serialize_idea(i) for i in ideas]}


@router.get("/ideas/{idea_id}")
async def get_idea(idea_id: str):
    """Fetch a single idea by ID."""
    try:
        idea = await innovation_collection.find_one({"_id": ObjectId(idea_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid idea id")

    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return serialize_idea(idea)


@router.post("/ideas/{idea_id}/vote")
async def vote_idea(idea_id: str, user: dict = Depends(get_current_user)):
    """Toggle upvote for an idea."""
    try:
        idea = await innovation_collection.find_one({"_id": ObjectId(idea_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid idea id")

    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    user_id = str(user["_id"])
    voters = [str(v) for v in idea.get("voters", [])]

    if user_id in voters:
        # Remove vote
        await innovation_collection.update_one(
            {"_id": ObjectId(idea_id)},
            {"$pull": {"voters": ObjectId(user["_id"])}, "$inc": {"votes": -1}}
        )
        return {"message": "Vote removed"}
    else:
        # Add vote
        await innovation_collection.update_one(
            {"_id": ObjectId(idea_id)},
            {"$push": {"voters": ObjectId(user["_id"])}, "$inc": {"votes": 1}}
        )
        return {"message": "Voted"}


@router.post("/ideas/{idea_id}/comment")
async def comment_idea(idea_id: str, payload: dict, user: dict = Depends(get_current_user)):
    """Add a comment to an idea."""
    text = (payload.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment text required")

    comment = {
        "user_id": ObjectId(user["_id"]) if isinstance(user["_id"], str) else user["_id"],
        "user_name": user.get("full_name", user.get("name", "User")),
        "text": text,
        "timestamp": datetime.now(ZoneInfo("UTC")),
    }

    try:
        await innovation_collection.update_one(
            {"_id": ObjectId(idea_id)},
            {"$push": {"comments": comment}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid idea id")

    return {"message": "Comment added"}


@router.post("/ideas/{idea_id}/feature-suggestion")
async def ai_feedback(idea_id: str, payload: dict, user: dict = Depends(get_current_user)):
    """AI feedback endpoint for idea improvement."""
    mode = payload.get("mode", "feasibility")
    idea = await innovation_collection.find_one({"_id": ObjectId(idea_id)})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    feedback_text = f"[AI analysis - {mode}] This idea shows promise! Consider detailing user impact and potential metrics for success."
    return {"ai_feedback": feedback_text}

@router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: str):
    innovation_collection.delete_one({"_id": ObjectId(idea_id)})
    return {"success": True}
