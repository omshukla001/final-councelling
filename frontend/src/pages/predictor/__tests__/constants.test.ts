import { describe, it, expect } from "vitest";
import { getCollegeType, quotaLabels, examQuotas, disciplineGroups } from "@/pages/predictor/constants";

describe("getCollegeType", () => {
  it("identifies IITs correctly", () => {
    expect(getCollegeType("Indian Institute of Technology Bombay")).toBe("IIT");
    expect(getCollegeType("Indian Institute of Technology Delhi")).toBe("IIT");
  });

  it("identifies NITs correctly", () => {
    expect(getCollegeType("National Institute of Technology, Trichy")).toBe("NIT");
    expect(getCollegeType("NIT Surathkal")).toBe("NIT");
  });

  it("identifies IIITs correctly", () => {
    expect(getCollegeType("Indian Institute of Information Technology, Allahabad")).toBe("IIIT");
    expect(getCollegeType("IIIT Hyderabad")).toBe("IIIT");
  });

  it("classifies others as GFTI", () => {
    expect(getCollegeType("IIEST Shibpur")).toBe("GFTI");
    expect(getCollegeType("School of Planning and Architecture")).toBe("GFTI");
  });

  it("does NOT classify IIT Information Technology as IIT", () => {
    // "Indian Institute of Information Technology" contains "Indian Institute of Technology"
    // but the regex should exclude it — this tests the negative lookahead
    expect(getCollegeType("Indian Institute of Information Technology Gwalior")).toBe("IIIT");
  });
});

describe("examQuotas", () => {
  it("JEE Advanced only has AI quota", () => {
    expect(examQuotas["JEE Advanced"]).toEqual(["AI"]);
  });

  it("JEE Main has multiple quotas", () => {
    expect(examQuotas["JEE Main"]).toContain("AI");
    expect(examQuotas["JEE Main"]).toContain("HS");
    expect(examQuotas["JEE Main"]).toContain("OS");
    expect(examQuotas["JEE Main"].length).toBeGreaterThan(3);
  });
});

describe("quotaLabels", () => {
  it("has human-readable labels for all standard quotas", () => {
    expect(quotaLabels["AI"]).toBe("All India");
    expect(quotaLabels["HS"]).toBe("Home State");
    expect(quotaLabels["OS"]).toBe("Other State");
  });
});

describe("disciplineGroups", () => {
  it("has at least 10 discipline groups", () => {
    expect(disciplineGroups.length).toBeGreaterThanOrEqual(10);
  });

  it("Computer Science group has relevant keywords", () => {
    const cs = disciplineGroups.find(g => g.label === "Computer Science");
    expect(cs).toBeDefined();
    expect(cs!.keywords).toContain("computer");
    expect(cs!.keywords).toContain("cse");
    expect(cs!.keywords).toContain("data science");
  });
});
