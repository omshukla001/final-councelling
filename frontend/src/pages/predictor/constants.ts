// Shared types and constants for Predictor components

export const getCollegeType = (name: string) => {
  if (/^Indian Institute of Technology(?!.*Information)/.test(name)) return "IIT";
  if (/Indian Institute of Information Technology|IIIT/.test(name)) return "IIIT";
  if (/National Institute of Technology|^NIT /.test(name)) return "NIT";
  return "GFTI";
};

export const examTypes = ["JEE Main", "JEE Advanced"];

export const quotaLabels: Record<string, string> = {
  AI: "All India", HS: "Home State", OS: "Other State",
  AP: "Andhra Pradesh", GO: "Goa", JK: "Jammu & Kashmir", LA: "Ladakh",
};

export const examQuotas: Record<string, string[]> = {
  "JEE Advanced": ["AI"],
  "JEE Main": ["AI", "AP", "GO", "HS", "JK", "LA", "OS"],
};

export const examDefaultQuotas: Record<string, string[]> = {
  "JEE Advanced": ["AI"],
  "JEE Main": ["AI", "HS", "OS"],
};

export const disciplineGroups: { label: string; keywords: string[] }[] = [
  { label: "Computer Science", keywords: ["computer", "cse", "software", "information technology", "data science", "artificial intelligence", " ai ", "machine learning", "cyber"] },
  { label: "Electrical & Electronics", keywords: ["electrical", "electronics", "vlsi", "instrumentation", "communication"] },
  { label: "Mechanical", keywords: ["mechanical", "production", "industrial", "manufacturing", "automobile"] },
  { label: "Civil & Architecture", keywords: ["civil", "architecture", "planning", "infrastructure", "structural"] },
  { label: "Chemical & Biotech", keywords: ["chemical", "biotechnology", "biochem", "pharmaceutical", "food", "polymer", "textile"] },
  { label: "Aerospace & Ocean", keywords: ["aerospace", "aeronautical", "ocean", "naval", "marine"] },
  { label: "Mining & Metallurgy", keywords: ["mining", "metallur", "ceramic", "mineral"] },
  { label: "Mathematics & Physics", keywords: ["mathematics", "physics", "applied science", "engineering science"] },
  { label: "Biomedical & Bio", keywords: ["biomedical", "bio engineering", "bioscience", "biological"] },
  { label: "Environmental & Energy", keywords: ["environment", "energy", "climate", "sustainability", "renewable"] },
  { label: "Management & Dual", keywords: ["management", "mba", "dual degree", "integrated"] },
];

export interface CollegeResult {
  id: string;
  name: string;
  branch: string;
  cutoff: number;
  fees: string;
  nirf: number;
  location: string;
  type: string;
  classification: string;
  historical_cutoffs: { year: number; closing_rank: number }[];
  imageUrl?: string;
}
