from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes import (
    auth_routes,
    user_routes,
    project_routes,
    team_routes,
    team_chat_routes,
    skill_routes,
    dashboard_routes,
    ai_learning_routes,
    ai_gamification_routes,
    innovation_lab_routes,
    learning_routes,
    community_routes,
    mentor_routes,
    team_files_routes,
    role_simulator,
    career_coach_routes,
    future_self_routes,
    mentor_research,
    mentor_collab,
    mentor_announcements,
)

app = FastAPI()

# 🔥 THIS LINE WAS MISSING
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(auth_routes.router, prefix="/api/auth")
app.include_router(user_routes.router, prefix="/api/users")
app.include_router(project_routes.router, prefix="/api/projects")
app.include_router(team_routes.router, prefix="/api/team")
app.include_router(skill_routes.router, prefix="/api/skills")
app.include_router(dashboard_routes.router, prefix="/api/dashboard")
app.include_router(team_chat_routes.router)
app.include_router(mentor_routes.router, prefix="/api")
app.include_router(team_files_routes.router, prefix="/api")
app.include_router(ai_learning_routes.router)
app.include_router(ai_gamification_routes.router)        
app.include_router(innovation_lab_routes.router)
app.include_router(role_simulator.router, prefix="/api")
app.include_router(learning_routes.router)
app.include_router(community_routes.router)
app.include_router(career_coach_routes.router)
app.include_router(future_self_routes.router)   
app.include_router(mentor_research.router)
app.include_router(mentor_collab.router)
app.include_router(mentor_announcements.router)

@app.get("/")
async def root():
    return {"message": "SkillSync Backend Running"}
