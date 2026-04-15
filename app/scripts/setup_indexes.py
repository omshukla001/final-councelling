import sys
import os
import certifi
import logging

from pymongo import MongoClient

# Add the root directory to sys.path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_indexes():
    mongo_uri = settings.MONGO_URI or os.getenv("MONGO_URI")
    if not mongo_uri or mongo_uri == "your-mongodb-connection-string-here":
        logger.error("MongoDB URI not provided.")
        return

    is_local = "localhost" in mongo_uri or "127.0.0.1" in mongo_uri
    client = MongoClient(
        mongo_uri, 
        tls=not is_local,
        tlsCAFile=certifi.where() if not is_local else None
    )
    
    db = client[settings.MONGO_DB_NAME]
    
    logger.info("Setting up MongoDB indexes...")

    # 1. Users Collection
    users = db["users"]
    try: users.create_index("firebase_uid", unique=True, name="idx_firebase_uid_unique")
    except Exception as e: logger.warning(e)

    # 2. Master Colleges Collection
    colleges = db["master_colleges"]
    try: colleges.create_index("college_id", unique=True, name="idx_college_id_unique")
    except Exception as e: logger.warning(e)

    # 3. Historical Cutoffs Collection (The heavy one)
    # The API frequently queries by category, quota, and relies heavily on this.
    cutoffs = db["historical_cutoffs"]
    
    # We heavily filter by category, quota, year. B-Tree is left-to-right.
    # An index on [category, quota] will heavily optimize the find()
    try:
        cutoffs.create_index(
            [("category", 1), ("quota", 1), ("round", 1), ("year", -1)],
            name="idx_cutoff_filters"
        )
    except Exception as e: logger.warning(e)
    # Also index college_id for fast branch detailing
    try: cutoffs.create_index("college_id", name="idx_college_id")
    except Exception as e: logger.warning(e)
    
    logger.info("Created optimization indexes on historical_cutoffs")
    logger.info("MongoDB indexing complete!")

if __name__ == "__main__":
    setup_indexes()
