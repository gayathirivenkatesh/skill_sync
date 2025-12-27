# routes/project_routes.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import requests
from routes.user_routes import get_current_user  # auth dependency

router = APIRouter()

# ----- Pydantic Model for Request -----
class SkillsRequest(BaseModel):
    user_skills: list[str]

# ----- GitHub Helper -----
def search_github_projects(skills: list[str], max_projects=5) -> list[dict]:
    projects = []
    headers = {"Accept": "application/vnd.github.v3+json"}

    for skill in skills:
        query = skill.replace(" ", "+")
        url = f"https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page={max_projects}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            for repo in data.get("items", []):
                projects.append({
                    "title": repo.get("name"),
                    "description": repo.get("description") or "No description provided.",
                    "url": repo.get("html_url"),
                    "source": "GitHub"
                })
        except requests.RequestException:
            continue
    return projects[:max_projects]

# ----- GitLab Helper -----
def search_gitlab_projects(skills: list[str], max_projects=3) -> list[dict]:
    projects = []
    for skill in skills:
        query = skill.replace(" ", "+")
        url = f"https://gitlab.com/api/v4/projects?search={query}&per_page={max_projects}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            for repo in data:
                projects.append({
                    "title": repo.get("name"),
                    "description": repo.get("description") or "No description provided.",
                    "url": repo.get("web_url"),
                    "source": "GitLab"
                })
        except requests.RequestException:
            continue
    return projects[:max_projects]

# ----- Kaggle Helper -----
def search_kaggle_datasets(skills, max_projects=5):
    """
    Search Kaggle datasets based on skills.
    Returns a list of project dicts: title, description, url, source.
    """
    projects = []
    for skill in skills:
        try:
            # Example using Kaggle API endpoint
            url = f"https://www.kaggle.com/api/v1/datasets/list?search={skill}"
            headers = {"User-Agent": "FastAPI ProjectMatcher"}
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Fix here: data is a list, not dict
            datasets = data if isinstance(data, list) else data.get("datasets", [])

            for ds in datasets[:max_projects]:
                projects.append({
                    "title": ds.get("title") or ds.get("name"),
                    "description": ds.get("subtitle") or ds.get("description") or "No description available",
                    "url": f"https://www.kaggle.com/datasets/{ds.get('ref') or ds.get('id')}",
                    "source": "Kaggle"
                })

        except Exception as e:
            print(f"Error fetching Kaggle projects for {skill}: {e}")

    return projects


# ----- Main Project Fetcher -----
def fetch_projects(skills: list[str], max_total=10) -> list[dict]:
    projects = []
    projects.extend(search_github_projects(skills, max_projects=5))
    projects.extend(search_gitlab_projects(skills, max_projects=3))
    projects.extend(search_kaggle_datasets(skills, max_projects=3))

    # Fallback if no projects
    if not projects:
        projects = [
            {"title": "Sample Project", "description": "Generic project template.", "url": "#", "source": "Fallback"},
            {"title": "Another Project", "description": "Example project for practice.", "url": "#", "source": "Fallback"}
        ]
    return projects[:max_total]

# ----- Route: Project Recommendations -----
@router.post("/recommendations")
async def recommend_projects(request: SkillsRequest, current_user: dict = Depends(get_current_user)):
    """
    Return online project suggestions from multiple sources based on the user's extracted skills.
    """
    user_skills = request.user_skills or current_user.get("skills", [])
    if not user_skills:
        return {
            "message": f"No skills found for {current_user.get('full_name')}, showing default projects.",
            "projects": fetch_projects([])
        }

    projects = fetch_projects(user_skills)
    return {
        "message": f"Projects fetched based on skills for {current_user.get('full_name')}.",
        "projects": projects
    }
