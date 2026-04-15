"""
Final import: Clear college_details and insert 93 matched colleges.
Uses the same matching logic from match_colleges_preview.py.
Only touches the 'college_details' collection — nothing else.
"""
import os, sys, json, re, hashlib
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from app.db.mongo import get_mongo_db


def normalize(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def get_keywords(name):
    stop = {
        "of","the","and","in","at","for","a","an","b","e","s","g","institute",
        "technology","engineering","science","information","national","indian",
        "design","manufacturing","management","university","college","school",
        "studies","department","campus","off","extension","center","central",
        "advanced","international","applied","electronics","communication",
        "crop","processing","food","entrepreneurship","foundry","forge",
        "handloom","infrastructure","research","maritime","aviation","mines",
        "women","energy","technical","planning","architecture","chemical",
        "courses","fees","admission","cutoff","placement","ranking","review",
        "seats","2024","2025","2026","latest","btech","be","mtech","me",
        "iiit","iit","nit","bit","iiitm","iiitdm","iiest","spa","niftem",
        "iiht","ism","csvtu","cu","hnb","pec","dtu","nsut","nerist",
    }
    words = normalize(name).split()
    return set(w for w in words if w not in stop and len(w) > 1)


def get_type(name):
    low = name.lower()
    if re.search(r"\biiitdm\b|indian institute of information technology.*design.*manufactur", low):
        return "IIITDM"
    if re.search(r"\biiitm\b|indian institute of information technology.*management", low):
        return "IIITM"
    if re.search(r"\biiit\b|indian institute of information technology", low):
        return "IIIT"
    if re.search(r"\biit\b|indian institute of technology", low):
        return "IIT"
    if re.search(r"\bnit\b|national institute of technology", low):
        return "NIT"
    if re.search(r"\bbit\b|birla institute of technology", low):
        return "BIT"
    if re.search(r"school of planning.*architecture|\bspa\b", low):
        return "SPA"
    if re.search(r"national institute of electronics", low):
        return "NIELIT"
    if re.search(r"national institute of food technology|\bniftem\b", low):
        return "NIFTEM"
    if re.search(r"indian institute of engineering science|\biiest\b", low):
        return "IIEST"
    return "OTHER"


# Manual overrides for tricky names
MANUAL_MAP = {
    "Indian Institute of Food Processing Technology": "lndian Institute of Food Processing Technology Thanjavur Tamil Naidu.",
    "University of Hyderabad": "University of Hyderabad",
    "Indian Institute of Handloom Technology,Varanasi": "Indian Institute of Handloom Technology(IIHT) Varanasi",
    "Indian Institute Of Handloom Technology": "Indian Institute of Handloom Technology Salem",
    "Dr. Shyama Prasad Mukherjee International Institute of Information Technology, Naya Raipur": "International Institute of Information Technology Naya Raipur",
    "JNU ": "Jawaharlal Nehru University Delhi",
    "MNIT Jaipur": "Malaviya National Institute of Technology Jaipur",
    "Manipal Institute of Technology BTech": "Manipal Institute of Technology Manipal",
    "Netaji Subhas University of Technology BTech": "Netaji Subhas University of Technology Delhi",
}

ARTICLE_PATTERNS = [
    "AEEE 2026", "JEE Main 2026", "NIRF Ranking",
    "Top 10 ", "Top 20 ", "Top 50 ", "Top 100 ",
    "Is 45 marks", "List of UGC", "enough to qualify",
    "Best Colleges", "vs ", "Comparison",
]


def run():
    db = get_mongo_db()

    # 1. Collect official institute names (read-only from JOSAA/CSAB)
    official_names = set()
    for c in db.list_collection_names():
        if "josaa" in c.lower() or "csab" in c.lower():
            for v in db[c].distinct("Institute"):
                if v and str(v).strip() and str(v).strip().lower() != "nan":
                    official_names.add(str(v).strip())
    official_list = sorted(official_names)
    official_info = [(name, get_type(name), get_keywords(name)) for name in official_list]

    print(f"📋 {len(official_names)} official institutes in JOSAA/CSAB data.")

    # 2. Clear ONLY college_details
    result = db["college_details"].delete_many({})
    print(f"🗑️  Cleared college_details ({result.deleted_count} docs removed).")

    # 3. Process scraped files
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    base_dir = os.path.join(project_root, "scrapped_colleges")

    imported = 0
    skipped = 0

    for fname in sorted(os.listdir(base_dir)):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(base_dir, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                continue

        college_name = data.get("college_name", "")
        if not college_name:
            continue

        # Skip articles
        if any(x.lower() in college_name.lower() for x in ARTICLE_PATTERNS):
            skipped += 1
            continue

        # Check manual overrides first
        matched_official = None
        for key, val in MANUAL_MAP.items():
            if key.lower() in college_name.lower():
                if val in official_names:
                    matched_official = val
                break

        # If no manual override, use keyword matching
        if not matched_official:
            file_clean = fname.replace(".json", "").replace("_", " ")
            combined = f"{college_name} {file_clean}"
            s_type = get_type(combined)
            s_keys = get_keywords(combined)

            best_match = None
            best_score = 0
            for o_name, o_type, o_keys in official_info:
                if not s_keys or not o_keys:
                    continue
                intersection = s_keys & o_keys
                union = s_keys | o_keys
                jaccard = len(intersection) / len(union)

                if s_type == o_type and s_type != "OTHER":
                    score = jaccard + 0.3
                elif s_type != "OTHER" and o_type != "OTHER" and s_type != o_type:
                    score = jaccard * 0.1
                else:
                    score = jaccard

                if score > best_score:
                    best_score = score
                    best_match = o_name

            if best_score >= 0.35 and best_match:
                matched_official = best_match

        if not matched_official:
            skipped += 1
            continue

        # Generate a stable ID from the official name
        college_id = int(hashlib.md5(matched_official.encode("utf-8")).hexdigest(), 16) % 1000000

        # Attach mapping and ID
        data["official_josaa_name"] = matched_official
        data["_id"] = college_id

        try:
            db["college_details"].insert_one(data)
            imported += 1
            print(f"  ✅ {imported:3}. {matched_official}")
        except Exception as e:
            if "duplicate key" in str(e).lower():
                # Same official name matched twice — update with latest data
                db["college_details"].replace_one({"_id": college_id}, data)
                print(f"  🔄 Updated duplicate: {matched_official}")
            else:
                print(f"  ❌ Error: {matched_official} — {e}")

    total = db["college_details"].count_documents({})
    print(f"\n{'='*60}")
    print(f"  ✅ Imported: {imported}")
    print(f"  ⏭️  Skipped: {skipped}")
    print(f"  📊 Total in 'college_details': {total}")
    print(f"{'='*60}")


if __name__ == "__main__":
    run()
