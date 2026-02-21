import os
import requests

JSEARCH_URL = "https://api.openwebninja.com/jsearch/search"


def fetch_jobs(role, location, experience_level=None, page=1):
    api_key = os.environ.get("JSEARCH_API_KEY")
    if not api_key:
        raise ValueError("JSEARCH_API_KEY environment variable is not set")

    headers = {
        "x-api-key": api_key,
    }

    params = {
        "query": f"{role} in {location}",
        "page": page,
        "num_pages": 1,
    }
    
    if experience_level:
        # e.g. no_experience, under_3_years_experience
        params["job_requirements"] = experience_level

    r = requests.get(JSEARCH_URL, headers=headers, params=params, timeout=60)
    r.raise_for_status()

    data = r.json().get("data", [])

    jobs = []
    for j in data:
        jobs.append({
            "role": j.get("job_title", ""),
            "company": j.get("employer_name", ""),
            "location": j.get("job_city", "") or j.get("job_state", "") or "",
            "description": j.get("job_description", ""),
            "apply_url": j.get("job_apply_link", ""),
            "source": j.get("job_publisher", ""),
        })

    return jobs
