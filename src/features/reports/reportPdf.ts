import { jsPDF } from "jspdf";

export type ReportDish = {
  name: string;
  quantity: number;
  amount: string;
};

export type DailyReport = {
  date: string;
  dishes: ReportDish[];
  efectivo: string;
  transferencia: string;
  total: string;
  message: string;
};

function money(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}

function labelDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function reportPdfBlob(report: DailyReport): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = 210;
  let y = 18;

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text("La Ruta del Sabor", width / 2, y, { align: "center" });
  y += 8;
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.text(`Cierre del ${labelDate(report.date)}`, width / 2, y, { align: "center" });
  y += 8;
  doc.setDrawColor(209, 74, 4);
  doc.setLineWidth(0.4);
  doc.line(16, y, width - 16, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Plato", 16, y);
  doc.text("Cant.", 130, y, { align: "right" });
  doc.text("Total", width - 16, y, { align: "right" });
  y += 3;
  doc.setLineWidth(0.2);
  doc.setDrawColor(40, 30, 20);
  doc.line(16, y, width - 16, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  if (report.dishes.length === 0) {
    doc.text("Sin platos vendidos.", 16, y);
    y += 8;
  }
  for (const dish of report.dishes) {
    if (y > 250) {
      doc.addPage();
      y = 18;
    }
    const name = doc.splitTextToSize(dish.name, 100) as string[];
    doc.text(name[0], 16, y);
    doc.text(String(dish.quantity), 130, y, { align: "right" });
    doc.text(money(dish.amount), width - 16, y, { align: "right" });
    y += 7;
  }

  y += 2;
  doc.line(16, y, width - 16, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text("Total efectivo", 16, y);
  doc.text(money(report.efectivo), width - 16, y, { align: "right" });
  y += 7;
  doc.text("Total transferencias", 16, y);
  doc.text(money(report.transferencia), width - 16, y, { align: "right" });
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total", 16, y);
  doc.text(money(report.total), width - 16, y, { align: "right" });

  return doc.output("blob");
}
