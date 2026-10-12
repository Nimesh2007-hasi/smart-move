
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PdfReportOptions = {
  title: string;
  fileName: string;
  lines: string[];
  startDate?: string;
  endDate?: string;
};

export function generateProcedurePdf({
  title,
  fileName,
  lines,
  startDate,
  endDate,
}: PdfReportOptions) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString();

  // Company heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SMART MOVE", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Transport Solutions", 14, 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 14, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${generatedAt}`, 14, 50);

  if (startDate && endDate) {
    doc.text(`Reporting period: ${startDate} to ${endDate}`, 14, 56);
  }

  // Format procedure output as a readable report table.
  const tableStartY = startDate && endDate ? 66 : 60;
  const reportLines = lines.length > 0 ? lines : ["No report data available."];

  autoTable(doc, {
    startY: tableStartY,
    head: [["No.", "Report Details"]],
    body: reportLines.map((line, index) => [
      String(index + 1),
      line || " ",
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [68, 80, 106],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // Footer and page numbers
  const pageCount = doc.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Smart Move Transport Solutions | Confidential Report",
      14,
      pageHeight - 8
    );
    doc.text(
      `Page ${page} of ${pageCount}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: "right" }
    );
  }

  doc.save(fileName);
}