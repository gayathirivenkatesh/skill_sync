from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import google.generativeai as genai
import os
import requests
from database import community_collection
from fastapi.encoders import jsonable_encoder

from routes.user_routes import get_current_user

# ---------------- CONFIG ----------------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = "HuggingFaceH4/zephyr-7b-beta"
HF_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HF_HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}
router = APIRouter(prefix="/api/community", tags=["Community AI"])

# ---------------- AI HELPERS ----------------

async def ai_moderate(text: str):
    prompt = f"""
    Check the following content for toxicity, abuse, hate, or unsafe language.
    Respond only with SAFE or UNSAFE.

    Content:
    {text}
    """
    response = model.generate_content(prompt)
    return "UNSAFE" not in response.text.upper()


async def ai_auto_tags(text: str):
    prompt = f"""
    Extract 3 to 5 relevant technical or professional tags
    (skills, roles, technologies) from the text.
    Return as comma-separated values.

    Text:
    {text}
    """
    response = model.generate_content(prompt)
    return [t.strip() for t in response.text.split(",") if t.strip()]


async def ai_summary_and_sentiment(text: str):
    prompt = f"""
    Summarize the following text in one sentence.
    Then classify sentiment as Positive, Neutral, or Needs Improvement.

    Format:
    Summary: <text>
    Sentiment: <one word>

    Text:
    {text}
    """
    response = model.generate_content(prompt)
    lines = response.text.splitlines()

    summary = ""
    sentiment = "Neutral"

    for l in lines:
        if l.lower().startswith("summary"):
            summary = l.split(":", 1)[1].strip()
        if l.lower().startswith("sentiment"):
            sentiment = l.split(":", 1)[1].strip()

    return summary, sentiment



@router.post("/post")
async def create_post(data: dict, user=Depends(get_current_user)):
    content = data.get("content", "").strip()
    if not content:
        raise HTTPException(400, "Post content is required")

    post = {
        "content": content,
        "author_id": ObjectId(user["_id"]),
        "author_name": user.get("name", "Anonymous"),
        "author_role": user.get("role", "student"),
        "tags": [],
        "likes": [],
        "replies": [],
        "created_at": datetime.utcnow()
    }

    await community_collection.insert_one(post)
    return {"message": "Post created successfully"}

# -------------------------------
# GET ALL POSTS (PUBLIC FEED)
# -------------------------------
@router.get("/posts")
async def get_posts():
    posts = await community_collection.find().sort(
        "created_at", -1
    ).to_list(100)

    safe_posts = []

    for post in posts:
        # ---- normalize likes ----
        likes_raw = post.get("likes", [])
        if not isinstance(likes_raw, list):
            likes_raw = []

        # ---- normalize replies ----
        replies = []
        for r in post.get("replies", []):
            replies.append({
                "_id": str(r.get("_id")),
                "author_name": r.get("author_name", "Anonymous"),
                "author_role": r.get("author_role", "Student"),
                "content": r.get("content", ""),
                "created_at": r.get("created_at")
            })

        safe_post = {
            "_id": str(post.get("_id")),
            "content": post.get("content", ""),
            "author_name": post.get("author_name", "Anonymous"),
            "author_role": post.get("author_role", "student"),
            "tags": [str(t) for t in post.get("tags", [])],
            "likes": [str(uid) for uid in likes_raw],
            "replies": replies,
            "created_at": post.get("created_at")
        }

        safe_posts.append(jsonable_encoder(safe_post))

    return safe_posts

# ---------------- ADD REPLY ----------------
@router.post("/reply/{post_id}")
async def reply_to_post(
    post_id: str,
    data: dict,
    user=Depends(get_current_user)
):
    content = data.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Reply content required")

    try:
        post = await community_collection.find_one(
            {"_id": ObjectId(post_id)}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    reply = {
        "_id": ObjectId(),
        "author_id": ObjectId(user["_id"]),
        "author_name": user.get("name", "Anonymous"),
        "author_role": user.get("role", "Student"),
        "content": content,
        "created_at": datetime.utcnow()
    }

    await community_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"replies": reply}}
    )

    return {
        "message": "Reply added successfully",
        "reply": {
            "_id": str(reply["_id"]),
            "author_name": reply["author_name"],
            "content": reply["content"],
            "created_at": reply["created_at"]
        }
    }

# ---------------- LIKE / UPVOTE ----------------
@router.post("/like/{item_id}")
async def toggle_like(item_id: str, user=Depends(get_current_user)):
    item = await community_collection.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(404, "Item not found")

    if user["_id"] in item["likes"]:
        await community_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$pull": {"likes": user["_id"]}}
        )
        return {"liked": False}
    else:
        await community_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$push": {"likes": user["_id"]}}
        )
        return {"liked": True}


# ---------------- NOTIFICATIONS ----------------
@router.get("/notifications")
async def notifications(user=Depends(get_current_user)):
    posts = await community_collection.find({
        "author_id": user["_id"],
        "type": "post"
    }).to_list(None)

    post_ids = [str(p["_id"]) for p in posts]

    replies = await community_collection.find({
        "parent_id": {"$in": post_ids}
    }).to_list(None)

    for r in replies:
        r["_id"] = str(r["_id"])

    return replies

# ---------------- ENDPOINT ----------------
@router.post("/ai-reply-suggestion")
async def ai_reply_suggestion(data: dict, user=Depends(get_current_user)):
    content = data.get("content", "").strip()

    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    prompt = f"""
You are a helpful student community member.
Write a short, constructive reply (2–3 sentences).

Post:
{content}
"""

    # -------- SAFE DEFAULT (NEVER FAILS) --------
    fallback_reply = (
        "This is an interesting point. I’d approach it step by step and would "
        "love to hear how others have handled similar situations."
    )

    # -------- TRY GEMINI --------
    try:
        response = model.generate_content(prompt)

        if response and getattr(response, "text", None):
            text = response.text.strip()
            if len(text) > 20:
                return {"suggested_reply": text}

    except Exception as e:
        print("Gemini failed:", e)

    # -------- FALLBACK: HUGGING FACE --------
    try:
        hf_response = requests.post(
            HF_URL,
            headers=HF_HEADERS,
            json={
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 120,
                    "temperature": 0.7
                }
            },
            timeout=20
        )

        hf_response.raise_for_status()
        result = hf_response.json()

        if isinstance(result, list) and "generated_text" in result[0]:
            text = result[0]["generated_text"].replace(prompt, "").strip()
            if text:
                return {"suggested_reply": text}

    except Exception as e:
        print("Hugging Face failed:", e)

    # -------- FINAL GUARANTEED RESPONSE --------
    return {"suggested_reply": fallback_reply}