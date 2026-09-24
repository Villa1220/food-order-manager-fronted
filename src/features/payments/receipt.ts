import { jsPDF } from "jspdf";

export type ReceiptLine = {
  name: string;
  quantity: number;
  unit_price: string;
};

export type ReceiptPayment = {
  receipt_number: string;
  amount: string;
  payment_method: "efectivo" | "transferencia";
  issued_at: string;
  order_code: string;
  table_number: string | null;
  lines: ReceiptLine[];
};

const METHOD_LABEL = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

function money(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}

/** Recibo de 80 mm. Los precios ya incluyen IVA; no se desglosa. */
export function downloadReceipt(payment: ReceiptPayment) {
  const width = 80;
  const lineH = 5;
  const height = 78 + payment.lines.length * lineH;
  const doc = new jsPDF({ unit: "mm", format: [width, height] });
  const issued = new Date(payment.issued_at);
  const when = issued.toLocaleString("es-EC", {
    dateStyle: "short",
    timeStyle: "short",
  });

  let y = 10;
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("La Ruta del Sabor", width / 2, y, { align: "center" });
  y += 5;
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.text("Comida típica ecuatoriana", width / 2, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Perucho · Quito", width / 2, y, { align: "center" });
  y += 6;
  doc.setLineWidth(0.2);
  doc.line(6, y, width - 6, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RECIBO", width / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const meta: [string, string][] = [
    ["Número", payment.receipt_number],
    ["Fecha", when],
    ["Pedido", payment.order_code],
    ["Mesa", payment.table_number ?? "—"],
    ["Pago", METHOD_LABEL[payment.payment_method]],
  ];
  for (const [label, value] of meta) {
    doc.text(label, 6, y);
    doc.text(value, width - 6, y, { align: "right" });
    y += 4.2;
  }
  y += 1;
  doc.line(6, y, width - 6, y);
  y += 5;

  for (const line of payment.lines) {
    const total = Number(line.unit_price) * line.quantity;
    const label = `${line.quantity}  ${line.name}`;
    const clipped = doc.splitTextToSize(label, 48) as string[];
    doc.text(clipped[0], 6, y);
    doc.text(money(total), width - 6, y, { align: "right" });
    y += lineH;
  }

  doc.line(6, y, width - 6, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", 6, y);
  doc.text(money(payment.amount), width - 6, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Precios con IVA incluido", width / 2, y, { align: "center" });
  y += 8;
  doc.setFont("times", "italic");
  doc.text("Gracias por su visita", width / 2, y, { align: "center" });

  doc.save(`${payment.receipt_number}.pdf`);
}
