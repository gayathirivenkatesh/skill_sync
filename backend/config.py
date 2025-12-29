import os
from dotenv import load_dotenv

# Load .env ONLY for local development
load_dotenv()

# =========================
# Required Environment Vars
# =========================
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Optional (safe defaults)
DATABASE_NAME = os.getenv("DATABASE_NAME", "skill_sync")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# =========================
# Safety Checks (IMPORTANT)
# =========================
missing = []
if not MONGO_URI:
    missing.append("MONGO_URI")
if not JWT_SECRET_KEY:
    missing.append("JWT_SECRET_KEY")

if missing:
    raise RuntimeError(
        f"Missing required environment variables: {', '.join(missing)}"
    )
