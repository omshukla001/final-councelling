/**
 * useCounsellor — custom hook for all CounsellorSheet state and logic.
 * Extracted from CounsellorSheet.tsx to separate data/logic from UI.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from "@/services/api";
import { useCompare } from "@/contexts/CompareContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import type { DropResult } from "@hello-pangea/dnd";

// ── Types ────────────────────────────────────────────────────────────────────
export interface CollegeResult {
  college_id: string;
  college_name: string;
  branch: string;
  closing_rank: number;
  chance: "Dream" | "Target" | "Safe";
  distance_from_rank: number;
  priority_index: number;
}

export interface CounsellorResponse {
  choices: CollegeResult[];
  counselling_type: string;
  exam_type: string;
  success: boolean;
}

export interface CounsellorFilters {
  branches: string[];
  categories: string[];
  quotas: string[];
  genders: string[];
}

export type ExamType = "JEE_ADVANCED" | "JEE_MAINS";

// ── Constants ────────────────────────────────────────────────────────────────
const SESSION_KEY = "counsellorSheetState";

export const QUOTA_NAMES: Record<string, string> = {
  AI: "All India", AP: "Andhra Pradesh", GO: "Goa",
  HS: "Home State", JK: "Jammu & Kashmir", LA: "Ladakh", OS: "Other State",
};

export const BRANCH_GROUPS: Record<string, string[]> = {
  "Computer Science & IT": ["Computer Science", "Information Technology", "Artificial Intelligence", "Data Science", "Machine Learning"],
  "Electronics & Electrical": ["Electronics and Communication", "Electrical Engineering", "Electronics and Electrical", "Instrumentation"],
  "Mechanical & Industrial": ["Mechanical Engineering", "Aerospace", "Aeronautical", "Production", "Industrial"],
  "Civil & Architecture": ["Civil Engineering", "Architecture"],
  "Chemical & Materials": ["Chemical Engineering", "Materials Science", "Metallurgical"],
  "Basic Sciences & Others": ["Mathematics and Computing", "Physics", "Chemistry", "Bio Technology", "Bio Medical"],
};

export const getCollegeType = (name: string): string => {
  if (/^Indian Institute of Technology(?!.*Information)/.test(name)) return "IIT";
  if (/Indian Institute of Information Technology|IIIT/.test(name)) return "IIIT";
  if (/National Institute of Technology|^NIT /.test(name)) return "NIT";
  return "GFTI";
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useCounsellor() {
  const { prefs, updatePrefs } = useUserPreferences();
  const saved = useRef(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
  });
  const s = saved.current();

  // Form state
  const [userRank, setUserRank] = useState<string>(s?.userRank ?? prefs.rank ?? "");
  const [bufferRange, setBufferRange] = useState<number>(s?.bufferRange ?? 5000);
  const [branchPreferences, setBranchPreferences] = useState<string[]>(s?.branchPreferences ?? prefs.preferredBranches ?? []);
  const [examType, setExamType] = useState<ExamType>(s?.examType ?? (prefs.examType === "JEE Advanced" ? "JEE_ADVANCED" : "JEE_MAINS"));
  const [categories, setCategories] = useState<string[]>(
    s?.categories ?? (Array.isArray(s?.category) ? s.category : (prefs.category ? [prefs.category] : ["OPEN"]))
  );
  const [selectedQuotas, setSelectedQuotas] = useState<string[]>(s?.selectedQuotas ?? (prefs.quotas?.length ? prefs.quotas : ["AI", "HS", "OS"]));
  const [gender, setGender] = useState(s?.gender ?? prefs.gender ?? "Gender-Neutral");

  // Results state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CounsellorResponse | null>(s?.results ?? null);
  const [error, setError] = useState<string | null>(null);
  const [orderedChoices, setOrderedChoices] = useState<CollegeResult[]>(s?.results?.choices ?? []);

  // UI state
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [activeChanceFilter, setActiveChanceFilter] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [trendCache, setTrendCache] = useState<Record<string, { year: number; rank: number }[]>>({});
  const [trendLoading, setTrendLoading] = useState<string | null>(null);

  // Data
  const { addCollege, removeCollege, isInCompare } = useCompare();
  const [filters, setFilters] = useState<Record<string, CounsellorFilters> | null>(null);
  const [isFiltersLoading, setIsFiltersLoading] = useState(true);

  // Persist to session
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      userRank, bufferRange, branchPreferences, examType, categories, selectedQuotas, gender, results
    }));
  }, [userRank, bufferRange, branchPreferences, examType, categories, selectedQuotas, gender, results]);

  // Load filters
  useEffect(() => {
    (async () => {
      try { setFilters((await api.get("/counsellor/filters")).data); }
      catch { /* filters are optional */ }
      finally { setIsFiltersLoading(false); }
    })();
  }, []);

  const currentFilters = filters ? filters[examType] : { branches: [], categories: [], quotas: [], genders: [] };

  // Sync quotas/category/gender when exam type changes
  useEffect(() => {
    if (filters?.[examType]) {
      const allowedQuotas = filters[examType].quotas;
      const validSelected = selectedQuotas.filter(q => allowedQuotas.includes(q));
      if (validSelected.length === 0) {
        setSelectedQuotas(examType === "JEE_ADVANCED" ? ["AI"] : ["AI", "HS", "OS"].filter(q => allowedQuotas.includes(q)));
      } else {
        setSelectedQuotas(validSelected);
      }
      const allowedCats = filters[examType].categories;
      const validCats = categories.filter(c => allowedCats.includes(c));
      setCategories(validCats.length > 0 ? validCats : [allowedCats[0] || "OPEN"]);
      if (!filters[examType].genders.includes(gender)) setGender(filters[examType].genders[0] || "Gender-Neutral");
    }
  }, [examType, filters]);

  // Toggle a category in/out of the multi-select. Always keep at least one selected.
  const toggleCategory = useCallback((c: string) => {
    setCategories((prev) => {
      if (prev.includes(c)) {
        const next = prev.filter((x) => x !== c);
        return next.length > 0 ? next : prev; // don't allow empty
      }
      return [...prev, c];
    });
  }, []);

  // Fetch counsellor sheet
  const fetchSheet = useCallback(async () => {
    const rank = parseInt(userRank);
    if (!rank || branchPreferences.length === 0) {
      setError("Please enter your rank and select at least one branch.");
      return;
    }
    updatePrefs({
      rank: userRank, examType: examType === "JEE_ADVANCED" ? "JEE Advanced" : "JEE Main",
      category: categories[0] || "OPEN", quotas: selectedQuotas, gender, preferredBranches: branchPreferences,
    });
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/counsellor/counsellor-sheet", {
        user_rank: rank, branch_preferences: branchPreferences,
        buffer_range: bufferRange, counselling_type: "JOSAA",
        exam_type: examType, category: categories, quota: selectedQuotas, gender,
      });
      setResults(res.data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userRank, branchPreferences, bufferRange, examType, categories, selectedQuotas, gender, updatePrefs]);

  // Sync ordered choices when results change
  useEffect(() => {
    if (results?.choices) setOrderedChoices([...results.choices]);
  }, [results]);

  // Drag and drop
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(orderedChoices);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setOrderedChoices(items);
  }, [orderedChoices]);

  // Trend loading
  const toggleTrend = useCallback(async (collegeId: string, branch: string) => {
    const key = `${collegeId}|${branch}`;
    if (expandedRow === key) { setExpandedRow(null); return; }
    setExpandedRow(key);
    if (!trendCache[key]) {
      setTrendLoading(key);
      try {
        const res = await api.get(`/recommendation-service/college/${collegeId}`);
        const matched = res.data?.branches?.find((b: { name: string }) => b.name === branch);
        setTrendCache((p) => ({
          ...p,
          [key]: matched?.cutoff_trend?.map((t: { year: number; closing_rank: number }) => ({
            year: t.year, rank: t.closing_rank,
          })).sort((a: { year: number }, b: { year: number }) => a.year - b.year) || [],
        }));
      } catch {
        setTrendCache((p) => ({ ...p, [key]: [] }));
      } finally {
        setTrendLoading(null);
      }
    }
  }, [expandedRow, trendCache]);

  const removeBranch = (idx: number) => setBranchPreferences((p) => p.filter((_, i) => i !== idx));

  const displayedColleges = useMemo(
    () => activeChanceFilter ? orderedChoices.filter(c => c.chance === activeChanceFilter) : orderedChoices,
    [orderedChoices, activeChanceFilter]
  );

  return {
    // Form state
    userRank, setUserRank, bufferRange, setBufferRange,
    branchPreferences, setBranchPreferences, removeBranch,
    examType, setExamType, categories, setCategories, toggleCategory,
    selectedQuotas, setSelectedQuotas, gender, setGender,
    // Results
    loading, results, error, orderedChoices, displayedColleges,
    // UI
    showBranchModal, setShowBranchModal, branchSearch, setBranchSearch,
    expandedCategory, setExpandedCategory, activeChanceFilter, setActiveChanceFilter,
    expandedRow, trendCache, trendLoading,
    // Data
    filters, currentFilters, isFiltersLoading,
    addCollege, removeCollege, isInCompare,
    // Actions
    fetchSheet, onDragEnd, toggleTrend,
  };
}
