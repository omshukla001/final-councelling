import os
import sys
import json
import re
import asyncio
from difflib import SequenceMatcher

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app.db.mongo import get_mongo_db

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

def clean_scraped_name(name):
    clean = name.lower()
    clean = re.sub(r'courses\s*&?\s*fees.*$', '', clean)
    clean = re.sub(r'course\s*&?\s*fees.*$', '', clean)
    clean = re.sub(r'courses\s*and\s*fees.*$', '', clean)
    clean = re.sub(r'b\.?e\.?\s*/\s*b\.?tech.*$', '', clean)
    clean = re.sub(r'b\.?tech\s*courses.*$', '', clean)
    clean = re.sub(r'b\.?tech.*$', '', clean)
    clean = re.sub(r'\s*-\s*indian institute of technology.*$', '', clean)
    clean = re.sub(r'\s*-\s*national institute of technology.*$', '', clean)
    clean = clean.replace('b.tech.', '').replace('b.e.', '').replace('btech', '')
    return clean.strip()

async def run_import():
    print("Starting import process...")
    try:
        db = get_mongo_db()
        print("Connected to MongoDB.")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return

    # 1. Gather official names
    all_collections = db.list_collection_names()
    official_names: set = set()

    for col_name in all_collections:
        if "nirf" in col_name.lower() or "seat matrix" in col_name.lower():
            continue
        for v in db[col_name].distinct("Institute"):
            if not v:
                continue
            s = str(v).strip()
            if s and s.lower() != "nan":
                official_names.add(s)
                
    official_list = sorted(list(official_names))

    base_dir = "scrapped_colleges"
    details_collection = db["college_details"]
    
    # CLEAR EXISTING COLLECTION to purge incorrect mappings
    print("Clearing existing college_details collection...")
    details_collection.delete_many({})

    success_count = 0
    skipped_count = 0

    for file in os.listdir(base_dir):
        if not file.endswith(".json"):
            continue
            
        file_path = os.path.join(base_dir, file)
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"Error reading {file}: {e}")
                continue
                
            c_name = data.get("college_name")
            if not c_name:
                continue
                
            # Ignore articles
            if "AEEE 2026" in c_name or "JEE Main 2026 Cutoff" in c_name or "NIRF Ranking" in c_name:
                skipped_count += 1
                continue

            clean_s = clean_scraped_name(c_name)
            
            best_match = None
            best_score = 0
            
            for o_name in official_list:
                clean_o = o_name.lower()
                score = similar(clean_s, clean_o)
                
                # Boosts for exact acronym hits
                if "iit " in clean_s and "indian institute of technology" in clean_o:
                    city_s = clean_s.split("iit ")[1].strip()
                    if city_s in clean_o:
                        score = 0.95
                if "nit " in clean_s and "national institute of technology" in clean_o:
                    city_s = clean_s.split("nit ")[1].strip()
                    if city_s in clean_o:
                        score = 0.95
                if "iiest " in clean_s and "indian institute of engineering science and technology" in clean_o:
                    score = 0.95
                if "sant longowal" in clean_s and "sant longowal institute" in clean_o:
                    score = 0.95
                        
                if score > best_score:
                    best_score = score
                    best_match = o_name
                    
            # STRICTER MATCHING: score must be > 0.85
            if best_score > 0.85:
                import hashlib
                college_id = int(hashlib.md5(str(best_match).encode('utf-8')).hexdigest(), 16) % 1000000

                
                # Attach the official mapping to the data payload for reference
                data["official_josaa_name"] = best_match
                data["_id"] = college_id
                
                try:
                    # Insert into database
                    details_collection.insert_one(data)
                    success_count += 1
                except Exception as e:
                    print(f"Failed to insert {best_match}: {e}")
            else:
                skipped_count += 1
                print(f"Skipped match: {clean_s} -> {best_match} (score: {best_score})")

    print(f"Successfully imported {success_count} colleges into 'college_details' collection.")
    print(f"Skipped {skipped_count} unmatched or irrelevant files.")

if __name__ == "__main__":
    asyncio.run(run_import())
