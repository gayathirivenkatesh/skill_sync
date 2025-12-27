from datetime import datetime
from typing import List 
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from database import peer_appreciations_collection
from fastapi import HTTPException
from routes.user_routes import get_current_user 

router = APIRouter()
# ===================== MODELS =====================    
class PeerAppreciationRequest(BaseModel):
    to_user: str
    message: str

# ===================== PEER REVIEW =====================

@router.post("/peer-appreciation/{team_id}")
async def submit_peer_appreciation(
    team_id: str,
    req: PeerAppreciationRequest,
    user=Depends(get_current_user)
):
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")

    await peer_appreciations_collection.insert_one({
        "team_id": team_id,
        "from_user": str(user["_id"]),
        "to_user": req.to_user,
        "message": req.message,
        "created_at": datetime.utcnow()
    })

    return {"message": "Appreciation sent"}

@router.get("/my-appreciations")
async def get_my_appreciations(user=Depends(get_current_user)):
    cursor = peer_appreciations_collection.find({
        "to_user": str(user["_id"])
    }).sort("created_at", -1)

    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)

    return {"appreciations": results}

@router.get("/peer-appreciation/{team_id}")
async def get_my_appreciations(team_id: str, user=Depends(get_current_user)):
    cursor = peer_appreciations_collection.find({
        "team_id": team_id,
        "to_user": str(user["_id"])
    }).sort("created_at", -1)

    items = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)

    return {"appreciations": items}
