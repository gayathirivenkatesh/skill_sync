from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from database import teams_collection, chat_messages_collection, users_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/team", tags=["Team Chat"])

# ---------------- Timezone (IST) ----------------
IST = timezone(timedelta(hours=5, minutes=30))

# ---------------- Helper: safely convert to ObjectId ----------------
def to_objectid(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")


# ---------------- GET: Team info ----------------
@router.get("/{team_id}")
async def get_team_info(team_id: str, current_user=Depends(get_current_user)):
    team = await teams_collection.find_one({"_id": to_objectid(team_id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    member_details = []
    for member in team.get("members", []):
        if isinstance(member, dict):
            member_id = member.get("_id") or member.get("id")
        else:
            member_id = member

        if not member_id:
            continue

        try:
            user = await users_collection.find_one({"_id": ObjectId(member_id)})
        except Exception:
            continue

        if user:
            member_details.append({
                "id": str(user["_id"]),
                "full_name": user.get("full_name", user.get("name", "Unknown")),
                "email": user.get("email", ""),
                "skills": user.get("skills", []),
            })

    return {
        "team": {
            "id": str(team["_id"]),
            "name": team.get("name", "Unnamed Team"),
            "required_skills": team.get("required_skills", []),
            "members": member_details,
        }
    }


# ---------------- GET: Team chat ----------------
@router.get("/{team_id}/chat")
async def get_team_chat(team_id: str, current_user=Depends(get_current_user)):
    team_obj_id = to_objectid(team_id)

    team = await teams_collection.find_one({"_id": team_obj_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    cursor = chat_messages_collection.find(
        {"team_id": str(team_obj_id)}
    ).sort("timestamp", 1)

    messages = []
    async for msg in cursor:
        ts = msg.get("timestamp")

        # convert UTC → IST and format 24-hour
        if isinstance(ts, datetime):
            ts = ts.replace(tzinfo=timezone.utc).astimezone(IST).strftime("%Y-%m-%d %H:%M:%S")

        messages.append({
            "id": str(msg["_id"]),
            "sender_id": msg.get("sender_id"),
            "sender_name": msg.get("sender_name", "Unknown"),
            "text": msg.get("text", ""),
            "timestamp": ts,
        })

    return {"messages": messages}


# ---------------- POST: Send message ----------------
@router.post("/{team_id}/chat")
async def send_team_message(team_id: str, data: dict, current_user=Depends(get_current_user)):
    text = data.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Message text is required")

    team_obj_id = to_objectid(team_id)
    team = await teams_collection.find_one({"_id": team_obj_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    message_doc = {
        "team_id": str(team_obj_id),
        "sender_id": str(current_user["_id"]),
        "sender_name": current_user.get("full_name", current_user.get("name", "User")),
        "text": text,
        # store in UTC (best practice)
        "timestamp": datetime.utcnow(),
    }

    await chat_messages_collection.insert_one(message_doc)

    return {"message": "Message sent successfully"}
