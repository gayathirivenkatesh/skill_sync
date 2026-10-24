from datetime import datetime
import re
from fastapi import APIRouter, Depends
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from routes.user_routes import get_current_user
from database import plagiarism_collection, team_files_collection

router = APIRouter()

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z0-9 ]', '', text)
    return text

@router.get("/plagiarism/{team_id}")
async def plagiarism(team_id: str, user=Depends(get_current_user)):
    files = await team_files_collection.find({"team_id": team_id}).to_list(None)

    if not files:
        await plagiarism_collection.delete_many({"team_id": team_id})
        return {
            "score": 0,
            "status": "No files uploaded",
            "checked_at": None
        }

    texts = [f["text"] for f in files if isinstance(f.get("text"), str) and f["text"].strip()]

    if not texts:
        await plagiarism_collection.delete_many({"team_id": team_id})
        return {
            "score": 0,
            "status": "No text content",
            "checked_at": None
        }

    combined_text = " ".join(texts)

    others = await team_files_collection.find(
        {"team_id": {"$ne": team_id}, "text": {"$exists": True, "$ne": ""}}
    ).to_list(None)

    corpus = [combined_text] + [o["text"] for o in others if o.get("text")]

    # 🔒 CRITICAL GUARD
    if len(corpus) < 2:
        report = {
            "team_id": team_id,
            "score": 0,
            "status": "Low Risk",
            "checked_at": datetime.utcnow()
        }
        await plagiarism_collection.update_one(
            {"team_id": team_id},
            {"$set": report},
            upsert=True
        )
        return report

    try:
        tfidf = TfidfVectorizer().fit_transform(corpus)
        sims = cosine_similarity(tfidf[0:1], tfidf[1:])[0]
        score = round(float(max(sims)) * 100, 2)
    except Exception as e:
        # 🔒 SAFETY NET
        return {
            "score": 0,
            "status": "Analysis failed",
            "checked_at": None
        }

    report = {
        "team_id": team_id,
        "score": score,
        "status": (
            "High Risk" if score > 40
            else "Medium Risk" if score > 20
            else "Low Risk"
        ),
        "checked_at": datetime.utcnow()
    }

    await plagiarism_collection.update_one(
        {"team_id": team_id},
        {"$set": report},
        upsert=True
    )

    return report
