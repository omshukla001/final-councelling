import { createContext, useContext, useState, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

export interface CompareCollege {
    college_id: string;
    name: string;
    type: string;
    state: string;
    nirf_rank?: number;
    branch_count?: number;
    avg_package?: number;
}

interface CompareContextType {
    compareList: CompareCollege[];
    addCollege: (c: CompareCollege) => boolean;
    removeCollege: (id: string) => void;
    clearAll: () => void;
    isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType>({
    compareList: [],
    addCollege: () => false,
    removeCollege: () => { },
    clearAll: () => { },
    isInCompare: () => false,
});

export function CompareProvider({ children }: { children: ReactNode }) {
    const [compareList, setCompareList] = useState<CompareCollege[]>([]);

    const addCollege = (c: CompareCollege): boolean => {
        if (compareList.find((x) => x.college_id === c.college_id)) return false;
        if (compareList.length >= 3) {
            alert("You can compare up to 3 colleges at a time. Remove one first.");
            return false;
        }
        setCompareList((prev) => [...prev, c]);
        return true;
    };

    const removeCollege = (id: string) => {
        setCompareList((prev) => prev.filter((c) => c.college_id !== id));
    };

    const clearAll = () => setCompareList([]);

    const isInCompare = (id: string) => compareList.some((c) => c.college_id === id);

    return (
        <CompareContext.Provider value={{ compareList, addCollege, removeCollege, clearAll, isInCompare }}>
            {children}
            <CompareBar />
        </CompareContext.Provider>
    );
}

function CompareBar() {
    const { compareList, removeCollege, clearAll } = useCompare();
    const location = useLocation();

    // Don't show the floating bar on the Compare page itself — it's redundant there
    if (location.pathname === "/compare") return null;
    // Don't show if no colleges selected
    if (compareList.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40 animate-slide-up">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground shrink-0">
                    Compare ({compareList.length}/3):
                </span>
                <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                    {compareList.map((c) => (
                        <div
                            key={c.college_id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary shrink-0"
                        >
                            <span className="max-w-[120px] truncate">{c.name}</span>
                            <button
                                onClick={() => removeCollege(c.college_id)}
                                className="w-4 h-4 rounded-full bg-primary/20 hover:bg-destructive/30 hover:text-destructive flex items-center justify-center transition-colors text-[10px]"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Clear
                    </button>
                    {/* Use React Router Link — NOT <a href> — to preserve React state */}
                    <Link
                        to="/compare"
                        className="px-4 py-2 rounded-xl text-xs font-semibold gradient-bg text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                        Compare →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function useCompare() {
    return useContext(CompareContext);
}
