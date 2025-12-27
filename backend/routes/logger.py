from datetime import datetime
from database import users_collection
from bson import ObjectId

async def log_activity(user_id, action):
    # normalize id
    if not isinstance(user_id, ObjectId):
        user_id = ObjectId(user_id)

    await users_collection.update_one(
        {"_id": user_id},
        {
            "$push": {
                "activity": {
                    "action": action,
                    "time": datetime.utcnow().isoformat()
                }
            }
        }
    )
