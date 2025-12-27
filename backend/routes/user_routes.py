from fastapi import APIRouter, status,Header, Depends, HTTPException
from typing import List,Optional
from bson import ObjectId
from database import users_collection
from utils.auth import decode_access_token
from models.user import UserOut
import re

router = APIRouter()

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)

    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    try:
        user_id = ObjectId(payload["user_id"])
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user id in token"
        )

    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # ✅ 🔥 NORMALIZE ROLE HERE (THIS FIXES EVERYTHING)
    role = user.get("role", "")
    user["role"] = role.strip().lower().replace(" ", "_")

    # optional safety
    user["_id"] = str(user["_id"])

    return user

# ----------------- Routes -----------------
# Profile
@router.get("/profile", response_model=UserOut)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserOut(**current_user)

# Update skills
@router.put("/update_skills", response_model=UserOut)
async def update_skills(skills: List[str], current_user: dict = Depends(get_current_user)):
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])}, {"$set": {"skills": skills}}
    )
    current_user["skills"] = skills
    return UserOut(**current_user)

# Get recent activity
@router.get("/activity")
async def get_activity(current_user: dict = Depends(get_current_user)):
    user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    activity = user.get("activity", [])
    activity.sort(key=lambda x: x.get("time", ""), reverse=True)
    return {"activities": activity}

# Optional: update bestFit
@router.put("/update_bestfit", response_model=UserOut)
async def update_bestfit(bestFit: str, current_user: dict = Depends(get_current_user)):
    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])}, {"$set": {"bestFit": bestFit}}
    )
    current_user["bestFit"] = bestFit
    return UserOut(**current_user)