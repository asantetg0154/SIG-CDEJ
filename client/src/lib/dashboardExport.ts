import { jsPDF } from "jspdf";

type ExportValue = string | number | null | undefined;

function normalize(value: ExportValue) {
  return String(value ?? "").replace(/"/g, '""');
}

export function downloadDashboardCsv(filename: string, headers: string[], rows: ExportValue[][]) {
  const content = [headers, ...rows].map(row => row.map(value => `"${normalize(value)}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadDashboardPdf(filename: string, title: string, headers: string[], rows: ExportValue[][]) {
  const document = new jsPDF({ unit: "mm", format: "a4" });
  document.setFillColor(7, 75, 58);
  document.rect(0, 0, 210, 30, "F");
  document.setTextColor(255, 255, 255);
  document.setFontSize(18);
  document.text("SIG-CDEJ", 14, 14);
  document.setFontSize(11);
  document.text(title, 14, 22);
  document.setTextColor(25, 35, 31);
  document.setFontSize(9);
  document.text(`Exporté le ${new Date().toLocaleString("fr-FR")}`, 14, 39);
  let y = 48;
  document.setFont("helvetica", "bold");
  document.text(headers.join("   |   "), 14, y);
  document.setFont("helvetica", "normal");
  y += 7;
  rows.forEach(row => {
    if (y > 280) {
      document.addPage();
      y = 18;
    }
    const line = row.map(value => String(value ?? "—")).join("   |   ");
    const lines = document.splitTextToSize(line, 180) as string[];
    document.text(lines, 14, y);
    y += Math.max(7, lines.length * 5);
  });
  document.save(filename);
}
