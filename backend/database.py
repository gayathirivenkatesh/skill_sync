from motor.motor_asyncio import AsyncIOMotorClient
import os

# =========================
# Environment Variables
# =========================
MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "skill_sync")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set in environment variables")

# =========================
# Mongo Client
# =========================
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]

# =========================
# Core Collections
# =========================
users_collection = db.get_collection("users")
projects_collection = db.get_collection("projects")
teams_collection = db.get_collection("teams")
skills_collection = db.get_collection("skills")
innovation_collection = db.get_collection("innovation_ideas")
learning_collection = db.get_collection("learning_resources")
career_pathways_collection = db.get_collection("career_pathways")
mentorship_sessions_collection = db.get_collection("mentorship_sessions")

# =========================
# Gamification & Communication
# =========================
chat_messages_collection = db.get_collection("chat_messages")
career_coach_collection = db.get_collection("career_coach_insights")
community_collection = db.get_collection("community_posts")

# =========================
# Analytics
# =========================
ai_sessions_collection = db.get_collection("ai_sessions")
research_items_collection = db.get_collection("research_items")
roles_collection = db.get_collection("role_progress")

# =========================
# Mentorship & Reviews
# =========================
mentorships_collection = db.get_collection("mentorships")
sessions_collection = db.get_collection("sessions")
reviews_collection = db.get_collection("reviews")
skill_gaps_collection = db.get_collection("skill_gaps")

# =========================
# Files & Submissions
# =========================
team_files_collection = db.get_collection("files")
submissions_collection = db.get_collection("submissions")
peer_reviews_collection = db.get_collection("peer_reviews")
plagiarism_collection = db.get_collection("plagiarism_reports")

# =========================
# Mentor & Community
# =========================
mentor_collab_collection = db.get_collection("mentor_collaboration_posts")
announcements_collection = db.get_collection("mentor_announcements")
peer_appreciations_collection = db.get_collection("peer_appreciations")
