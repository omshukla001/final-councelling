/**
 * PDF export utility for counsellor sheet results.
 * Extracted from CounsellorSheet.tsx handleExport callback.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CollegeResult } from "@/hooks/useCounsellor";

interface ExportParams {
  choices: CollegeResult[];
  userRank: string;
  category: string;
  gender: string;
  examType: string;
}

export function exportCounsellorPdf({ choices, userRank, category, gender, examType }: ExportParams): void {
  if (!choices || choices.length === 0) {
    alert("No results to export. Please run the simulator first.");
    return;
  }

  try {
    const doc = new jsPDF();

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("JEE COUNSELLOR SHEET", 14, 20);

    // Separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(59, 130, 246);
    doc.line(14, 25, 196, 25);

    // User details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`User Rank: ${userRank}`, 14, 35);
    doc.text(`Category: ${category}`, 14, 42);
    doc.text(`Gender: ${gender}`, 14, 49);
    doc.text(`Exam: ${examType === "JEE_MAINS" ? "JEE Main" : "JEE Advanced"}`, 14, 56);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 110, 35);
    doc.text(`Choices Analyzed: ${choices.length}`, 110, 42);

    const tableColumn = ["#", "Institute", "Branch", "Cutoff Rank", "Chance"];
    const tableRows = choices.map((c, i) => [i + 1, c.college_name, c.branch, c.closing_rank, c.chance]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 10, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 70 },
        2: { cellWidth: 60 },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 20, halign: "center" },
      },
      styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`Counsellor_Sheet_${userRank}.pdf`);
  } catch (err) {
    console.error("PDF Export error:", err);
    alert("Failed to generate PDF. Please check the console for details.");
  }
}
