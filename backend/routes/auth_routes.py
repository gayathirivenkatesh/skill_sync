from datetime import datetime
from fastapi import APIRouter, HTTPException
from utils.auth import hash_password, verify_password, create_access_token
from database import users_collection
from models.user import UserCreate as UserRegister, UserLogin

router = APIRouter()

@router.post("/register")
async def register(user: UserRegister):
    if await users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "full_name": user.full_name,
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role,                     # ✅ STORE ROLE
        "avatar": "/default-avatar.png",
        "created_at": datetime.utcnow(),        # ✅ OK to store
    }

    result = await users_collection.insert_one(user_doc)

    token = create_access_token({
        "user_id": str(result.inserted_id),
        "role": user.role                       # ✅ embed role in token
    })

    return {
        "user": {
            "id": str(result.inserted_id),
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "avatar": "/default-avatar.png"
        },
        "token": token
    }

@router.post("/login")
async def login(user: UserLogin):
    existing_user = await users_collection.find_one({"email": user.email})

    if not existing_user or not verify_password(
        user.password, existing_user["password"]
    ):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token({
        "user_id": str(existing_user["_id"]),
        "role": existing_user["role"]           # ✅ role in token
    })

    return {
        "user": {
            "id": str(existing_user["_id"]),
            "full_name": existing_user["full_name"],
            "email": existing_user["email"],
            "role": existing_user["role"],
            "avatar": existing_user.get("avatar", "/default-avatar.png")
        },
        "token": token
    }
