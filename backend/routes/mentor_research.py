from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from routes.user_routes import get_current_user
from database import users_collection

router = APIRouter(prefix="/api/mentor/research", tags=["Mentor Research"])

IST = timezone(timedelta(hours=5, minutes=30))


class ResearchItem(BaseModel):
    title: str
    content: str


def to_object_id(value):
    if isinstance(value, ObjectId):
        return value
    return ObjectId(str(value))


# ---------------- GET ----------------
@router.get("/")
async def get_research(current_user=Depends(get_current_user)):

    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor = await users_collection.find_one({"_id": to_object_id(current_user["_id"])})

    items = mentor.get("research_items", [])

    # --------- FIX OLD ITEMS WITHOUT id ---------
    updated = False
    for item in items:
        if not item.get("id"):
            item["id"] = str(ObjectId())
            updated = True

    if updated:
        await users_collection.update_one(
            {"_id": to_object_id(current_user["_id"])},
            {"$set": {"research_items": items}}
        )

    # --------- build response ---------
    result = []

    for item in items:
        ts = item.get("created_at")

        try:
            dt = datetime.fromisoformat(ts)
            dt = dt.replace(tzinfo=timezone.utc).astimezone(IST)
            display_time = dt.strftime("%d %b %Y, %I:%M %p")
        except Exception:
            display_time = ts

        result.append({
            "id": item.get("id"),
            "title": item.get("title"),
            "content": item.get("content"),
            "created_at": ts,
            "display_time": display_time,
        })

    return {"items": result}


# ---------------- ADD ----------------
@router.post("/add")
async def add_research(item: ResearchItem, current_user=Depends(get_current_user)):

    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_id = to_object_id(current_user["_id"])

    new_item = {
        "id": str(ObjectId()),
        "title": item.title,
        "content": item.content,
        "created_at": datetime.utcnow().isoformat()
    }

    await users_collection.update_one(
        {"_id": mentor_id},
        {"$push": {"research_items": new_item}}
    )

    dt = datetime.fromisoformat(new_item["created_at"])
    dt = dt.replace(tzinfo=timezone.utc).astimezone(IST)
    display_time = dt.strftime("%d %b %Y, %I:%M %p")

    new_item["display_time"] = display_time

    return new_item


# ---------------- DELETE ----------------
@router.delete("/delete/{item_id}")
async def delete_research(item_id: str, current_user=Depends(get_current_user)):

    if current_user.get("role") != "mentor":
        raise HTTPException(status_code=403, detail="Access denied")

    mentor_id = to_object_id(current_user["_id"])

    # try delete by id
    res = await users_collection.update_one(
        {"_id": mentor_id},
        {"$pull": {"research_items": {"id": item_id}}}
    )

    # fallback: delete by created_at (OLD ITEMS)
    if res.modified_count == 0:
        await users_collection.update_one(
            {"_id": mentor_id},
            {"$pull": {"research_items": {"created_at": item_id}}}
        )

    return {"message": "Deleted"}
