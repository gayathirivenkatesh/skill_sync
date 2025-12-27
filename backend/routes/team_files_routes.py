from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from datetime import datetime
from bson import ObjectId
import os, uuid
from database import teams_collection, team_files_collection, plagiarism_collection
from routes.user_routes import get_current_user
from PyPDF2 import PdfReader

router = APIRouter(prefix="/team-files", tags=["Team Files"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ------------------ Helpers ------------------
def extract_text(file_path: str) -> str:
    if not file_path.lower().endswith(".pdf"):
        return ""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        print("PDF extract error:", e)
        return ""

def is_authorized(team, user_id: str):
    creator_id = str(team.get("creator_id"))
    member_ids = [m["id"] for m in team.get("members", [])]
    return user_id == creator_id or user_id in member_ids

def files_locked(team):
    return team.get("files_locked", False)

# ------------------ Upload File ------------------
@router.post("/upload/{team_id}")
async def upload_team_file(
    team_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        team_obj_id = ObjectId(team_id)
    except:
        raise HTTPException(400, "Invalid team ID")

    team = await teams_collection.find_one({"_id": team_obj_id})
    if not team:
        raise HTTPException(404, "Team not found")

    if files_locked(team):
        raise HTTPException(403, "Files are locked")

    user_id = str(current_user["_id"])
    if not is_authorized(team, user_id):
        raise HTTPException(403, "Not authorized")

    # Save file
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text for plagiarism
    extracted_text = extract_text(file_path)

    # Insert into DB
    result = await team_files_collection.insert_one({
        "team_id": team_id,
        "filename": file.filename,
        "file_type": file.content_type,
        "url": f"/uploads/{unique_name}",
        "uploaded_by": user_id,
        "uploaded_at": datetime.utcnow(),
        "text": extracted_text
    })

    if not result.inserted_id:
        raise HTTPException(500, "Failed to store file info in DB")

    return {"message": "File uploaded successfully", "id": str(result.inserted_id)}

# ------------------ Get Files ------------------
@router.get("/{team_id}")
async def get_team_files(team_id: str, current_user: dict = Depends(get_current_user)):
    try:
        team_obj_id = ObjectId(team_id)
    except:
        raise HTTPException(400, "Invalid team ID")

    team = await teams_collection.find_one({"_id": team_obj_id})
    if not team:
        raise HTTPException(404, "Team not found")

    user_id = str(current_user["_id"])
    if not is_authorized(team, user_id):
        raise HTTPException(403, "Not authorized")

    files = []
    async for f in team_files_collection.find({"team_id": team_id}):
        files.append({
            "id": str(f["_id"]),          # ⚡ must be "id" for frontend
            "filename": f["filename"],
            "url": f["url"],
            "uploaded_by": f["uploaded_by"],
            "uploaded_at": f["uploaded_at"]
        })

    return {"files": files}

# ------------------ Delete File ------------------
@router.delete("/{team_id}/{file_id}")
async def delete_team_file(
    team_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        team = await teams_collection.find_one({"_id": ObjectId(team_id)})
        file_doc = await team_files_collection.find_one({"_id": ObjectId(file_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    if files_locked(team):
        raise HTTPException(status_code=403, detail="Files are locked")

    user_id = str(current_user["_id"])

    # ✅ Creator OR uploader can delete
    if user_id != str(team["creator_id"]) and user_id != file_doc["uploaded_by"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    # Delete physical file
    file_path = file_doc["url"].lstrip("/")
    if os.path.exists(file_path):
        os.remove(file_path)

    # Delete DB record
    await team_files_collection.delete_one({"_id": ObjectId(file_id)})

    # Cleanup plagiarism if no files left
    remaining = await team_files_collection.count_documents({"team_id": team_id})
    if remaining == 0:
        await plagiarism_collection.delete_many({"team_id": team_id})

    return {"message": "File deleted successfully"}
