"""
Match scraped college JSON files in scrapped_colleges/ to official
JOSAA/CSAB institute names.  Output a markdown report for review.
Does NOT write to the database.
"""
import os, sys, json, re
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from app.db.mongo import get_mongo_db

# ─── helpers ───────────────────────────────────────────────────────

def normalize(s):
    """Lowercase, remove punctuation, collapse whitespace."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def get_keywords(name):
    """Return a set of meaningful keywords from a name."""
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
    """Detect institution type from name (order matters!)."""
    low = name.lower()
    # Must check IIITDM/IIITM/IIIT before IIT
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

# ─── main ──────────────────────────────────────────────────────────

def run():
    db = get_mongo_db()

    # Collect official names
    official_names = set()
    for c in db.list_collection_names():
        if "josaa" in c.lower() or "csab" in c.lower():
            for v in db[c].distinct("Institute"):
                if v and str(v).strip() and str(v).strip().lower() != "nan":
                    official_names.add(str(v).strip())
    official_list = sorted(official_names)

    # Pre-compute type + keywords for each official name
    official_info = []
    for name in official_list:
        official_info.append((name, get_type(name), get_keywords(name)))

    # Read scraped files
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    base_dir = os.path.join(project_root, "scrapped_colleges")
    report_path = os.path.join(project_root, "college_matching_report.md")

    matched = []
    unmatched = []

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
        # Skip known article pages (not actual college data)
        article_patterns = [
            "AEEE 2026", "JEE Main 2026", "NIRF Ranking",
            "Top 10 ", "Top 20 ", "Top 50 ", "Top 100 ",
            "Is 45 marks", "List of UGC", "enough to qualify",
            "Best Colleges", "vs ", "Comparison",
        ]
        if any(x.lower() in college_name.lower() for x in article_patterns):
            continue

        # ── Manual overrides for known tricky names ──
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
        # Check if college_name starts with any manual key
        manual_match = None
        for key, val in MANUAL_MAP.items():
            if key.lower() in college_name.lower():
                manual_match = val
                break
        if manual_match and manual_match in official_names:
            matched.append((fname, college_name, manual_match, 1.0))
            continue

        # Use BOTH the filename (underscore-separated) and college_name for matching
        file_clean = fname.replace(".json", "").replace("_", " ")
        combined = f"{college_name} {file_clean}"

        s_type = get_type(combined)
        s_keys = get_keywords(combined)

        best_match = None
        best_score = 0

        for o_name, o_type, o_keys in official_info:
            # Start with keyword overlap (Jaccard)
            if not s_keys or not o_keys:
                continue
            intersection = s_keys & o_keys
            union = s_keys | o_keys
            jaccard = len(intersection) / len(union)

            # Type bonus/penalty
            if s_type == o_type and s_type != "OTHER":
                score = jaccard + 0.3  # strong bonus for same type
            elif s_type != "OTHER" and o_type != "OTHER" and s_type != o_type:
                score = jaccard * 0.1  # heavy penalty for type mismatch
            else:
                score = jaccard

            if score > best_score:
                best_score = score
                best_match = o_name

        if best_score >= 0.35 and best_match:
            matched.append((fname, college_name, best_match, best_score))
        else:
            unmatched.append((fname, college_name, best_match, best_score))

    # Write markdown report
    lines = []
    lines.append("# College Matching Report\n")
    lines.append(f"**Scraped files:** {len(matched) + len(unmatched)}  ")
    lines.append(f"**Matched:** {len(matched)}  ")
    lines.append(f"**Unmatched:** {len(unmatched)}\n")

    lines.append("## ✅ Matched Colleges\n")
    for i, (fname, cname, match, score) in enumerate(matched, 1):
        lines.append(f"**{i}.** `{cname}`")
        lines.append(f"   → **{match}**\n")

    lines.append(f"\n---\n\n## ❌ Unmatched ({len(unmatched)} files)\n")
    for i, (fname, cname, closest, score) in enumerate(unmatched, 1):
        cl = closest if closest else "no match found"
        lines.append(f"**{i}.** `{cname}`")
        lines.append(f"   → closest: {cl} (score: {score:.2f})\n")

    report = "\n".join(lines)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(report)
    print(f"\n\nReport saved to: {report_path}")


if __name__ == "__main__":
    run()
