/**
 * UserPreferencesContext — Shared JEE profile state across all pages.
 * Persists to localStorage so preferences survive page refresh.
 * All pages (Predictor, CounsellorSheet, AI Counsellor, etc.) read from here
 * instead of asking the user to re-enter rank/category/exam every time.
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface UserPreferences {
  rank: string;
  examType: string;
  category: string;
  quotas: string[];
  gender: string;
  homeState: string;
  preferredBranches: string[];
  profileComplete: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  rank: "",
  examType: "JEE Main",
  category: "OPEN",
  quotas: ["AI", "HS", "OS"],
  gender: "Gender-Neutral",
  homeState: "",
  preferredBranches: [],
  profileComplete: false,
};

const STORAGE_KEY = "cw_user_preferences";

interface UserPreferencesContextType {
  prefs: UserPreferences;
  updatePrefs: (partial: Partial<UserPreferences>) => void;
  resetPrefs: () => void;
  isProfileComplete: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

function loadFromStorage(userId: string): UserPreferences {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_PREFS };
}

function saveToStorage(userId: string, prefs: UserPreferences) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(prefs));
  } catch {}
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);

  // Load preferences when user logs in
  useEffect(() => {
    if (user?.id) {
      setPrefs(loadFromStorage(user.id));
    } else {
      setPrefs(DEFAULT_PREFS);
    }
  }, [user?.id]);

  const updatePrefs = useCallback((partial: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const updated = { ...prev, ...partial };
      // Mark as complete if rank is filled
      if (updated.rank && parseInt(updated.rank) > 0) {
        updated.profileComplete = true;
      }
      if (user?.id) saveToStorage(user.id, updated);
      return updated;
    });
  }, [user?.id]);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    if (user?.id) localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
  }, [user?.id]);

  const isProfileComplete = prefs.profileComplete && !!prefs.rank && parseInt(prefs.rank) > 0;

  return (
    <UserPreferencesContext.Provider value={{ prefs, updatePrefs, resetPrefs, isProfileComplete }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  return ctx;
}

export default UserPreferencesContext;
