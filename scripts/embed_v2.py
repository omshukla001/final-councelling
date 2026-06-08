"""
Embed V2 Data into Pinecone for RAG Pipeline.
"""
import os
import sys
import logging
from typing import List, Dict, Any
from pinecone import Pinecone

# Setup path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.db.mongo import get_mongo_db
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("embed_v2")

LOCAL_EMBED_MODEL = "all-MiniLM-L6-v2"
embed_fn = SentenceTransformerEmbeddingFunction(model_name=LOCAL_EMBED_MODEL)

def fetch_and_format_colleges() -> List[Dict[str, Any]]:
    db = get_mongo_db()
    
    logger.info("Fetching master_colleges...")
    colleges = list(db.master_colleges.find({}))
    
    logger.info("Fetching historical_cutoffs from 2021 to 2025...")
    # Fetch cutoffs for the requested 5-year window
    cutoffs = list(db.historical_cutoffs.find({"year": {"$in": [2021, 2022, 2023, 2024, 2025]}}))
    
    # Group cutoffs by (college_id, branch, year)
    # We want to keep the latest round for each (college_id, branch, year, category, quota, gender)
    cutoff_map = {}
    for c in cutoffs:
        cid = c.get("college_id")
        branch = c.get("branch")
        year = c.get("year")
        cat = c.get("category")
        quota = c.get("quota")
        gender = c.get("gender", "Gender-Neutral")
        rnd = c.get("round", 1)
        cr = c.get("closing_rank", 0)
        
        if not cid or not branch or not year or cr <= 0:
            continue
            
        key = (cid, branch)
        if key not in cutoff_map:
            cutoff_map[key] = {}
            
        year_key = year
        if year_key not in cutoff_map[key]:
            cutoff_map[key][year_key] = {}
            
        sub_key = (cat, quota, gender)
        # Keep the record with the highest round (latest) or lowest closing rank if same round
        if sub_key not in cutoff_map[key][year_key]:
            cutoff_map[key][year_key][sub_key] = c
        else:
            existing = cutoff_map[key][year_key][sub_key]
            if rnd > existing.get("round", 1):
                cutoff_map[key][year_key][sub_key] = c
            elif rnd == existing.get("round", 1) and cr < existing.get("closing_rank", 0):
                cutoff_map[key][year_key][sub_key] = c

    # Create a quick lookup for college info
    college_info_map = {}
    for coll in colleges:
        fee_str = "See Details"
        fees_data = coll.get("fees", {})
        if isinstance(fees_data, dict):
            inst_fees = fees_data.get("institute_fee", [])
            if isinstance(inst_fees, list):
                for f in inst_fees:
                    if "Tuition Fee" in f.get("fee_type", ""):
                        fee_str = f"Rs. {f.get('amount', '')}/sem"
                        break
        college_info_map[coll.get("college_id")] = {
            "name": coll.get("official_josaa_name", "Unknown"),
            "state": coll.get("state", "India"),
            "nirf": coll.get("nirf_rank_2024", "N/A"),
            "fee_str": fee_str
        }

    documents = []
    
    import hashlib
    for (cid, branch), years_data in cutoff_map.items():
        c_info = college_info_map.get(cid)
        if not c_info:
            continue
            
        name = c_info["name"]
        
        text = f"College: {name}\nState: {c_info['state']}\nNIRF Rank: {c_info['nirf']}\nTuition: {c_info['fee_str']}\nBranch: {branch}\n"
        
        # Iterate over years in descending order (newest first)
        for year in sorted(years_data.keys(), reverse=True):
            branch_cutoffs = years_data[year]
            if not branch_cutoffs:
                continue
                
            text += f"\n{year} Closing Ranks (Latest rounds):\n"
            
            # Sort cutoffs by closing rank
            sorted_cutoffs = sorted(branch_cutoffs.values(), key=lambda x: x.get("closing_rank", 0))
            
            for c in sorted_cutoffs:
                cat = c.get("category", "")
                quo = c.get("quota", "")
                rnd = c.get("round", 1)
                gender = c.get("gender", "Gender-Neutral")
                cr = c.get("closing_rank", 0)
                
                # Brief format to save tokens
                text += f"- {cat} ({quo}, {gender}) R{rnd}: {cr}\n"

        # Unique ID per college + branch combination
        branch_hash = hashlib.md5(branch.encode('utf-8')).hexdigest()[:8]
        doc_id = f"col_{cid}_{branch_hash}"

        documents.append({
            "id": doc_id,
            "text": text,
            "metadata": {
                "college_id": cid,
                "name": name,
                "branch": branch,
                "text": text[:35000] # Safe limit for pinecone metadata
            }
        })
        
    return documents

def embed_and_upload():
    api_key = settings.PINECONE_API_KEY
    index_name = settings.PINECONE_INDEX_NAME or "colleges"
    
    if not api_key:
        logger.error("PINECONE_API_KEY not found.")
        return
        
    pc = Pinecone(api_key=api_key)
    if index_name not in pc.list_indexes().names():
        from pinecone import ServerlessSpec
        logger.info(f"Creating Pinecone index '{index_name}'...")
        pc.create_index(
            name=index_name,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        
    index = pc.Index(index_name)
    
    docs = fetch_and_format_colleges()
    logger.info(f"Formatted {len(docs)} colleges. Generating embeddings...")
    
    # Delete all existing vectors to flush old V1 legacy data
    logger.info("Wiping old data from Pinecone...")
    try:
        index.delete(delete_all=True)
    except Exception as e:
        logger.warning(f"Could not delete old vectors (may be empty): {e}")
        
    # Batch embed
    batch_size = 50
    for i in range(0, len(docs), batch_size):
        batch = docs[i:i+batch_size]
        texts = [b["text"] for b in batch]
        embeddings = embed_fn(texts)
        
        vectors = []
        for j, b in enumerate(batch):
            # cast to python float list
            vec = embeddings[j]
            if hasattr(vec, "tolist"):
                vec = vec.tolist()
                
            vectors.append({
                "id": b["id"],
                "values": vec,
                "metadata": b["metadata"]
            })
            
        logger.info(f"Upserting batch {i//batch_size + 1} ({len(batch)} vectors)...")
        index.upsert(vectors=vectors)
        
    logger.info("Done! V2 Database is now active in Pinecone.")

if __name__ == "__main__":
    embed_and_upload()
