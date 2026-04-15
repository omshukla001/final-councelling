/**
 * Shared TypeScript types for college-related data structures.
 * Replaces scattered `any` annotations across CollegeDetail tabs,
 * CounsellorSheet, Predictor, and Compare pages.
 */

// ── Scraped Data Sub-types ───────────────────────────────────────────────────

export interface CollegeDetails {
  established_year?: number;
  director?: string;
  motto?: string;
  about?: string;
  website?: string;
  campus_area?: string;
  contact?: string;
  type?: string;
}

export interface FeeEntry {
  fee_type: string;
  amount: number | string;
  currency?: string;
}

export interface FeeStructure {
  institute_fee?: FeeEntry[];
  hostel_fee?: FeeEntry[];
  mess_fee?: FeeEntry[];
  other_fee?: FeeEntry[];
}

export interface PlacementSummary {
  companies_visited?: number;
  students_placed?: number;
  placement_percentage?: number;
}

export interface NewPlacements {
  highest_package?: number;
  average_package?: number;
  median_package?: number;
  lowest_package?: number;
}

export interface ReviewData {
  overall_rating?: number;
  placements_rating?: number;
  infrastructure_rating?: number;
  faculty_rating?: number;
  campus_life_rating?: number;
  [key: string]: number | string | undefined;
}

export interface SeatMatrixEntry {
  branch_name?: string;
  branch?: string;
  total_seats?: number;
  gen_seats?: number | string;
  obc_seats?: number | string;
  sc_seats?: number | string;
  st_seats?: number | string;
  ews_seats?: number | string;
  ews?: number | string;
  [key: string]: unknown;
}

export interface BtechCourseFee {
  course_name?: string;
  fee_amount?: number;
  fee_type?: string;
  duration?: string;
  [key: string]: unknown;
}

export interface NewFees {
  btech_course_fees?: BtechCourseFee[];
  [key: string]: unknown;
}

export interface ScrapedData {
  details?: CollegeDetails;
  fee_structure?: FeeStructure;
  fees?: Record<string, unknown>;
  new_fees?: NewFees;
  placement_summary?: PlacementSummary;
  new_placements?: NewPlacements;
  reviews?: ReviewData;
  seats?: SeatMatrixEntry[];
  campus?: Record<string, unknown>;
  facilities?: string[];
  hostel?: Record<string, unknown>;
  courses?: Record<string, unknown>[];
  rankings?: Array<unknown[]>;
  [key: string]: unknown; // Allow extension without breaking
}

// ── Main College Type ────────────────────────────────────────────────────────

export interface CollegeData {
  college_id: string | number;
  name: string;
  state: string;
  type: "IIT" | "NIT" | "IIIT" | "GFTI" | string;
  nirf_rank: number | null;
  nirf_display: string | null;
  scraped_data: ScrapedData;
  branches: BranchCutoff[];
  branch_count: number;
  available_years: number[];
}

export interface BranchCutoff {
  name: string;
  total_entries: number;
  cutoff_trend: CutoffTrendEntry[];
}

export interface CutoffTrendEntry {
  year: number;
  round: number;
  closing_rank: number;
  opening_rank: number;
}

// ── Tab Props (shared across CollegeDetailSections) ──────────────────────────

export interface OverviewTabProps {
  college: CollegeData;
  scraped: ScrapedData;
}

export interface CutoffsTabProps {
  branches: BranchCutoff[];
  availableYears: number[];
}

export interface SeatsTabProps {
  seats: SeatMatrixEntry[];
}

export interface FeesTabProps {
  scraped: ScrapedData;
  collegeName?: string;
}

export interface PlacementsTabProps {
  scraped: ScrapedData;
  bulkPlacement: Record<string, unknown> | null;
  bulkPlacementLoading: boolean;
}

export interface CampusTabProps {
  scraped: ScrapedData;
}
