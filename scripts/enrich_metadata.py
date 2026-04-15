"""
Enrich master_colleges with missing metadata using Groq LLM.
Fills in established_year, campus_size, motto, director for all colleges.
"""
import sys
import os
import json
import time
import requests

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.mongo import get_mongo_db
from app.config import settings


def enrich_colleges():
    db = get_mongo_db()

    # Find colleges with empty established_year
    query = {"$or": [
        {"details.established_year": ""},
        {"details.established_year": None},
        {"details.established_year": {"$exists": False}},
    ]}
    colleges = list(db.master_colleges.find(query))
    print(f"Found {len(colleges)} colleges needing enrichment.")

    count = 0
    for idx, c in enumerate(colleges):
        name = c.get("official_josaa_name")
        if not name:
            continue

        print(f"[{idx+1}/{len(colleges)}] Enriching: {name}")

        prompt = (
            f'You are a data extraction AI. Provide the following factual details '
            f'for the Indian engineering college: "{name}".\n'
            f'Return ONLY a valid JSON object with these keys:\n'
            f'{{\n'
            f'    "established_year": "YYYY",\n'
            f'    "campus_size_acres": "Number in acres (just the number)",\n'
            f'    "motto": "College motto in English (or N/A)",\n'
            f'    "director": "Current director/chairman name (or N/A)"\n'
            f'}}\n'
            f'If a value is unknown, use "N/A".'
        )

        try:
            headers = {
                "Authorization": f"Bearer {settings.GROK_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0,
                "response_format": {"type": "json_object"}
            }

            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            res_data = response.json()
            data = json.loads(res_data["choices"][0]["message"]["content"])

            # Build update document
            update_fields = {}
            est = data.get("established_year", "")
            if est and est != "N/A":
                update_fields["details.established_year"] = str(est)

            size = data.get("campus_size_acres", "")
            if size and str(size) != "N/A":
                size_str = str(size).strip()
                # Append "Acres" if not already present
                if "acre" not in size_str.lower():
                    size_str += " Acres"
                update_fields["details.campus_size"] = size_str

            motto = data.get("motto", "")
            if motto and motto != "N/A":
                update_fields["details.motto"] = str(motto)

            director = data.get("director", "")
            if director and director != "N/A":
                update_fields["details.director"] = str(director)

            if update_fields:
                db.master_colleges.update_one(
                    {"_id": c["_id"]},
                    {"$set": update_fields}
                )
                print(f"  -> Updated: est={est}, size={size}, motto={motto[:30] if motto else 'N/A'}")
                count += 1
            else:
                print(f"  -> All fields N/A, skipping.")

            # Rate limit: Groq free tier is 30 req/min
            time.sleep(2.5)

        except Exception as e:
            print(f"  -> ERROR: {e}")
            time.sleep(3)

    print(f"\nDone! Successfully enriched {count}/{len(colleges)} colleges.")


if __name__ == "__main__":
    enrich_colleges()
