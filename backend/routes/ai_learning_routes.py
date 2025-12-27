from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from database import ai_sessions_collection, users_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Learning"])

# ---------- Start Learning Session ----------
@router.post("/start")
async def start_learning(data: dict, current_user: dict = Depends(get_current_user)):
    skill = data.get("skill")
    if not skill:
        raise HTTPException(status_code=400, detail="Skill required")
    
    session_doc = {
        "user_id": ObjectId(current_user["_id"]),
        "skill": skill,
        "status": "started",
        "progress": 0,
        "xp_earned": 0,
        "messages": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await ai_sessions_collection.insert_one(session_doc)
    
    # Return first question (mocked)
    return {"session_id": str(result.inserted_id), "question": "Explain the basics of this skill."}

# ---------- Monitor / Submit Answer ----------
@router.post("/monitor")
async def monitor_learning(data: dict, current_user: dict = Depends(get_current_user)):
    session_id = data.get("session_id")
    answer = data.get("answer")
    if not session_id or not answer:
        raise HTTPException(status_code=400, detail="Session ID and answer required")
    
    session = await ai_sessions_collection.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Simple XP calculation: +10 per answer
    xp_added = 10
    feedback = f"Good job! You earned {xp_added} XP."

    # Next question (mocked)
    next_question = "What is the next concept you want to learn?"

    messages = session.get("messages", [])
    messages.append({"role": "user", "text": answer})
    messages.append({"role": "ai", "text": feedback})
    messages.append({"role": "ai", "text": f"Next question: {next_question}"})

    await ai_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "xp_earned": session.get("xp_earned",0) + xp_added,
            "messages": messages,
            "status": "active",
            "updated_at": datetime.utcnow()
        }}
    )

    return {"xp_added": xp_added, "feedback": feedback, "next_question": next_question}

# ---------- Update Progress / Engagement ----------
@router.post("/progress")
async def update_progress(data: dict, current_user: dict = Depends(get_current_user)):
    session_id = data.get("session_id")
    progress = data.get("progress", 0)

    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")

    update_data = {
        "progress": progress,
        "status": "active",
        "updated_at": datetime.utcnow()
    }

    await ai_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_data}
    )
    return {"status": "active", "progress": progress}

# ---------- End Session ----------
@router.post("/end")
async def end_session(data: dict):
    session_id = data.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")

    await ai_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"status": "completed", "updated_at": datetime.utcnow()}}
    )
    return {"status": "completed"}

# ---------- Get Current Session Status ----------
@router.get("/status")
async def get_status(current_user: dict = Depends(get_current_user)):
    session = await ai_sessions_collection.find_one(
        {"user_id": ObjectId(current_user["_id"]), "status": {"$in": ["started","active"]}}
    )
    if not session:
        return {"session_id": None}
    return {
        "session_id": str(session["_id"]),
        "status": session.get("status", "started"),
        "xp": session.get("xp_earned", 0),
        "messages": session.get("messages", [])
    }
