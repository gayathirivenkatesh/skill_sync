from fastapi import APIRouter, Depends, HTTPException
from routes.user_routes import get_current_user
from routes.logger import log_activity   
from datetime import date, datetime
import random
from database import roles_collection  
from bson import ObjectId

router = APIRouter(prefix="/role-simulator", tags=["Role Simulator"])

# -----------------------------
# ROLE DEFINITIONS (REAL ROLES)
# -----------------------------
ROLES = {
    "Frontend Developer": {
        "skills": ["Responsive Design", "React", "Accessibility", "Performance"],
        "contexts": ["Login Page", "Dashboard", "Landing Page"]
    },
    "Backend Developer": {
        "skills": ["API Design", "Authentication", "Error Handling", "Scalability"],
        "contexts": ["User Service", "Payment API", "Auth Service"]
    },
    "UI/UX Designer": {
        "skills": ["User Research", "Wireframing", "Visual Design", "Usability"],
        "contexts": ["Mobile App", "Web Platform"]
    }
}

# -----------------------------
# UTILS
# -----------------------------
def generate_daily_task(role: str):
    today = date.today().isoformat()
    random.seed(role + today)

    skill = random.choice(ROLES[role]["skills"])
    context = random.choice(ROLES[role]["contexts"])

    return {
        "date": today,
        "role": role,
        "skill": skill,
        "title": f"Improve {skill}",
        "description": f"Work on {skill} for the {context}. Think like a real {role}.",
        "expected_outcome": f"Explain your approach for {skill} in {context}."
    }

def ai_evaluate(reflection: str, role: str):
    reflection = reflection.lower()

    skill_scores = {}
    total = 0

    for skill in ROLES[role]["skills"]:
        keywords = skill.lower().split()
        matched = sum(1 for k in keywords if k in reflection)
        score = min(matched * 25, 25)
        skill_scores[skill] = score
        total += score

    final_score = min(total, 100)

    verdict = (
        "Excellent role understanding"
        if final_score >= 80
        else "Good, but improve depth"
        if final_score >= 50
        else "Needs improvement"
    )

    return {
        "final_score": final_score,
        "skill_breakdown": skill_scores,
        "feedback": verdict
    }

# -----------------------------
# API ENDPOINTS
# -----------------------------
@router.get("/roles")
async def get_roles():
    return list(ROLES.keys())

@router.post("/start/{role}")
async def start_role(role: str, user=Depends(get_current_user)):
    if role not in ROLES:
        raise HTTPException(404, "Role not found")

    task = generate_daily_task(role)

    task_doc = {
        "user_id": ObjectId(user["_id"]),
        "role": role,
        "task": task,
        "reflection": None,
        "score": None,
        "feedback": None,
        "created_at": datetime.utcnow(),
        "submitted_at": None
    }

    await roles_collection.insert_one(task_doc)

    # 🔥 ACTIVITY LOG
    await log_activity(
        ObjectId(user["_id"]),
        f"Started role simulator task as {role}"
    )

    return task

@router.get("/today-task")
async def today_task(user=Depends(get_current_user)):
    user_id = ObjectId(user["_id"])

    task_doc = await roles_collection.find_one(
        {"user_id": user_id, "task.date": date.today().isoformat()}
    )

    if not task_doc:
        raise HTTPException(404, "No task assigned")

    return task_doc["task"]

@router.post("/evaluate")
async def evaluate(payload: dict, user=Depends(get_current_user)):
    reflection = payload.get("reflection")
    role = payload.get("role")

    if not reflection or not role:
        raise HTTPException(400, "Invalid submission")

    # Evaluate answer
    result = ai_evaluate(reflection, role)

    user_id = ObjectId(user["_id"])

    # Update DB results
    await roles_collection.update_one(
        {"user_id": user_id, "role": role, "task.date": date.today().isoformat()},
        {
            "$set": {
                "reflection": reflection,
                "score": result["final_score"],
                "feedback": result["feedback"],
                "skill_breakdown": result["skill_breakdown"],
                "submitted_at": datetime.utcnow()
            }
        }
    )

    # 🔥 ACTIVITY LOG
    await log_activity(
        user_id,
        f"Completed role simulator evaluation for {role} — Score: {result['final_score']}"
    )

    return result
