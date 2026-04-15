import sys
import os
import asyncio
from typing import Dict, Any, List, Optional
import logging

logging.basicConfig(level=logging.INFO)

# Add project root to sys path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db.mongo import connect_to_mongo, get_mongo_db
from app.api.v1.recommendation_service import get_college_list

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BULK_DATA_DIR = os.path.join(PROJECT_ROOT, "Bulk_Placements_Data")

# Copy the parsing functions from our placement_data API endpoint:
from app.api.v1.placement_data import _find_best_match, _parse_placement_text

async def main():
    print("Connecting to MongoDB...")
    connect_to_mongo()
    db = get_mongo_db()
    
    # We will create a collection called 'placement_data'
    placement_col = db["placement_data"]
    
    print("Fetching list of all colleges...")
    res = await get_college_list(page_size=2000)
    colleges = res.get("colleges", [])
    
    success_count = 0
    not_found_count = 0
    error_count = 0

    print(f"Checking {len(colleges)} colleges against Bulk_Placements_Data...")
    for c in colleges:
        college_id = c["college_id"]
        college_name = c["name"]
        
        txt_path = _find_best_match(college_name)
        if not txt_path:
            not_found_count += 1
            continue
            
        try:
            with open(txt_path, "r", encoding="utf-8") as f:
                raw_text = f.read()
                
            parsed_data = _parse_placement_text(raw_text)
            
            # Upsert into MongoDB placement_data collection
            document = {
                "college_id": college_id,
                "college_name": college_name,
                "source_file": os.path.basename(os.path.dirname(txt_path)),
                "data": parsed_data
            }
            
            placement_col.update_one(
                {"college_id": college_id},
                {"$set": document},
                upsert=True
            )
            success_count += 1
            print(f"✅ Upserted placement data for {college_name}")
            
        except Exception as e:
            print(f"❌ Error parsing {college_name}: {e}")
            error_count += 1

    print(f"\nMigration Complete:")
    print(f"  - Successfully imported into MongoDB: {success_count}")
    print(f"  - No placement data found for: {not_found_count}")
    print(f"  - Errors during import: {error_count}")

if __name__ == "__main__":
    asyncio.run(main())
