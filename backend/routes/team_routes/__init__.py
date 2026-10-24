from fastapi import APIRouter

from .team_core import router as team_core_router
from .submissions import router as submissions_router
from .rubric import router as rubric_router
from .peer_review import router as peer_router
from .plagiarism import router as plagiarism_router

router = APIRouter()

router.include_router(team_core_router)
router.include_router(submissions_router)
router.include_router(rubric_router)
router.include_router(peer_router)
router.include_router(plagiarism_router)
