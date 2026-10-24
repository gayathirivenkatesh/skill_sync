from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from database import collaboration_collection, users_collection
from routes.user_routes import get_current_user

router = APIRouter(prefix="/api/collaboration", tags=["Collaboration Hub"])


# 🧠 Helper to safely serialize MongoDB documents
def serialize_project(project):
    """Convert ObjectIds and nested data for JSON response"""
    if not project:
        return {}

    project["_id"] = str(project["_id"])

    # Convert creator_id if it’s still an ObjectId
    if isinstance(project.get("creator_id"), ObjectId):
        project["creator_id"] = str(project["creator_id"])

    # Serialize members
    for m in project.get("members", []):
        if isinstance(m.get("_id"), ObjectId):
            m["_id"] = str(m["_id"])

    # Serialize updates (discussion messages)
    for u in project.get("updates", []):
        if isinstance(u.get("user_id"), ObjectId):
            u["user_id"] = str(u["user_id"])
        if isinstance(u.get("timestamp"), datetime):
            u["timestamp"] = u["timestamp"].isoformat()

    # Format created_at
    if isinstance(project.get("created_at"), datetime):
        project["created_at"] = project["created_at"].isoformat()

    return project


# 🧩 1️⃣ Create new collaboration project
@router.post("/create")
async def create_project(data: dict, user: dict = Depends(get_current_user)):
    name = data.get("name")
    description = data.get("description")

    if not name or not description:
        raise HTTPException(status_code=400, detail="Name and description required")

    project_doc = {
        "name": name,
        "description": description,
        "creator_id": user["_id"],
        "creator_name": user.get("full_name", "Unknown User"),
        "members": [
            {
                "_id": user["_id"],
                "full_name": user.get("full_name", "Unknown User"),
                "email": user.get("email", ""),
            }
        ],
        "created_at": datetime.utcnow(),
        "status": "active",
        "updates": [],
    }

    result = await collaboration_collection.insert_one(project_doc)
    project_doc["_id"] = result.inserted_id
    return serialize_project(project_doc)


# 🧩 2️⃣ Get all projects for a user
@router.get("/projects")
async def get_projects(user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    projects = await collaboration_collection.find({"members._id": user_id}).to_list(None)
    return {"projects": [serialize_project(p) for p in projects]}


# 🧩 3️⃣ Join an existing project
@router.post("/join/{project_id}")
async def join_project(project_id: str, user: dict = Depends(get_current_user)):
    try:
        project = await collaboration_collection.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Prevent duplicate members
    if any(str(m["_id"]) == str(user["_id"]) for m in project.get("members", [])):
        raise HTTPException(status_code=400, detail="Already a member")

    new_member = {
        "_id": user["_id"],
        "full_name": user.get("full_name", "Unknown User"),
        "email": user.get("email", ""),
    }

    await collaboration_collection.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"members": new_member}},
    )

    return {"message": "Joined project successfully"}


# 🧩 4️⃣ Post project update (like a discussion or status)
@router.post("/update/{project_id}")
async def post_update(project_id: str, data: dict, user: dict = Depends(get_current_user)):
    message = data.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    update_entry = {
        "user_id": user["_id"],
        "full_name": user.get("full_name", "Unknown User"),
        "message": message,
        "timestamp": datetime.utcnow(),
    }

    try:
        await collaboration_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$push": {"updates": update_entry}},
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    return {"message": "Update posted successfully"}


# 🧩 5️⃣ Get a single collaboration project with updates
@router.get("/{project_id}")
async def get_project_details(project_id: str, user: dict = Depends(get_current_user)):
    try:
        project = await collaboration_collection.find_one({"_id": ObjectId(project_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid project ID format")

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Ensure the user is a member
    if not any(str(m["_id"]) == str(user["_id"]) for m in project.get("members", [])):
        raise HTTPException(status_code=403, detail="Access denied")

    return serialize_project(project)
