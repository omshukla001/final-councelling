/**
 * College detail tab components — barrel file.
 * 
 * Re-exports all tab components from their source files for a clean import API.
 * This allows consumers to import from a single path:
 *   import { OverviewTab, FeesTab } from "@/pages/college-detail"
 * 
 * The components are currently defined in CollegeDetailSections.tsx and
 * CollegeDetailExtendedSections.tsx. As they are extracted into individual
 * files, this barrel file will be updated to re-export from the new locations.
 */

// ── Core tabs (from CollegeDetailSections) ──
export { OverviewTab, CutoffsTab, SeatsTab, formatINR } from "../CollegeDetailSections";

// ── Extended tabs (from CollegeDetailExtendedSections) ──
export { FeesTab, PlacementsTab, CampusTab } from "../CollegeDetailExtendedSections";
