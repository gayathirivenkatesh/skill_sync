# routes/mentor_collaboration.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import mentor_collab_collection
from routes.user_routes import get_current_user
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/mentor/collaboration", tags=["Mentor Collaboration"])

# ---------------- Models ----------------
class PostRequest(BaseModel):
    title: str
    content: str

class CommentRequest(BaseModel):
    post_id: str
    content: str

# ---------------- Routes ----------------

@router.get("/")
async def get_posts(current_user: dict = Depends(get_current_user)):
    posts = []
    async for p in mentor_collab_collection.find().sort("created_at", -1):
        p["_id"] = str(p["_id"])
        for c in p.get("comments", []):
            c["created_at"] = c["created_at"].isoformat() if isinstance(c["created_at"], datetime) else c["created_at"]
        posts.append(p)
    return {"posts": posts}

@router.post("/add")
async def add_post(data: PostRequest, current_user: dict = Depends(get_current_user)):
    if not data.title.strip() or not data.content.strip():
        raise HTTPException(status_code=400, detail="Title and content cannot be empty")

    post_doc = {
        "title": data.title.strip(),
        "content": data.content.strip(),
        "user_id": current_user["_id"],
        "user_name": current_user.get("name", "Mentor"),
        "comments": [],
        "created_at": datetime.utcnow()
    }

    result = await mentor_collab_collection.insert_one(post_doc)
    post_doc["_id"] = str(result.inserted_id)
    return post_doc

@router.post("/comment")
async def add_comment(data: CommentRequest, current_user: dict = Depends(get_current_user)):
    post = await mentor_collab_collection.find_one({"_id": ObjectId(data.post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = {
        "user_id": current_user["_id"],
        "user_name": current_user.get("name", "Mentor"),
        "content": data.content.strip(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await mentor_collab_collection.update_one(
        {"_id": ObjectId(data.post_id)},
        {"$push": {"comments": comment}}
    )

    return comment

@router.delete("/post/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await mentor_collab_collection.find_one({"_id": ObjectId(post_id)})

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # allow only owner
    if str(post["user_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="You can delete only your posts")

    await mentor_collab_collection.delete_one({"_id": ObjectId(post_id)})

    return {"message": "Post deleted"}

@router.delete("/comment/{post_id}/{comment_created}")
async def delete_comment(post_id: str, comment_created: str, current_user: dict = Depends(get_current_user)):

    # match by created_at iso + user_id
    result = await mentor_collab_collection.update_one(
        {
            "_id": ObjectId(post_id)
        },
        {
            "$pull": {
                "comments": {
                    "created_at": comment_created,
                    "user_id": current_user["_id"]
                }
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found or not yours")

    return {"message": "Comment deleted"}
