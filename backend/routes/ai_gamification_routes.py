from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from database import ai_sessions_collection, users_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Gamification"])

@router.get("/gamification")
async def get_gamification_data(current_user: dict = Depends(get_current_user)):
    """
    🎮 Returns gamification data for the logged-in user:
    XP, total progress, completed sessions, and AI feedback history.
    """
    user_id = ObjectId(current_user["_id"])

    # Fetch user details
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total_xp = user.get("xp", 0)

    # Fetch all AI sessions
    sessions = await ai_sessions_collection.find({"user_id": user_id}).to_list(length=None)
    if not sessions:
        return {
            "total_xp": 0,
            "total_progress": 0,
            "completed_sessions": 0,
            "sessions": [],
            "feedback_history": []
        }

    total_progress = sum(s.get("progress", 0) for s in sessions)
    completed_sessions = sum(1 for s in sessions if s.get("status") == "completed")

    # Flatten feedback history across all sessions
    feedback_history = []
    for s in sessions:
        for fb in s.get("feedback", []):
            feedback_history.append({
                "skill": s.get("skill", "Unknown"),
                "question": s.get("current_question", {}).get("question", ""),
                "answer": fb.get("answer", ""),
                "score": fb.get("score", 0),
                "comment": fb.get("comment", "")
            })

    # Construct response
    return {
        "total_xp": total_xp,
        "total_progress": round(total_progress, 1),
        "completed_sessions": completed_sessions,
        "sessions": [
            {
                "skill": s.get("skill", ""),
                "status": s.get("status", ""),
                "progress": round(s.get("progress", 0), 1),
                "xp_earned": s.get("xp_earned", 0),
            }
            for s in sessions
        ],
        "feedback_history": feedback_history
    }
