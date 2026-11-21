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

const FOLDER_NAME = "La Ruta del Sabor";
const FOLDER_DB = "ruta-sabor-recibos";
const FOLDER_KEY = "raiz";

type FolderHandle = FileSystemDirectoryHandle & {
  requestPermission?: (descriptor: { mode: "readwrite" }) => Promise<PermissionState>;
};

function canPickFolder(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

function openFolderDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FOLDER_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("carpeta");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSavedFolder(): Promise<FolderHandle | null> {
  const db = await openFolderDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("carpeta").objectStore("carpeta").get(FOLDER_KEY);
    request.onsuccess = () => resolve((request.result as FolderHandle | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function rememberFolder(handle: FolderHandle): Promise<void> {
  const db = await openFolderDb();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("carpeta", "readwrite")
      .objectStore("carpeta")
      .put(handle, FOLDER_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function receiptDay(issuedAt: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(issuedAt));
}

async function receiptsRoot(): Promise<FolderHandle> {
  const saved = await readSavedFolder().catch(() => null);
  if (saved?.requestPermission) {
    const permission = await saved.requestPermission({ mode: "readwrite" });
    if (permission === "granted") return saved;
  }
  const picked = await window.showDirectoryPicker({
    id: "ruta-sabor-documentos",
    startIn: "documents",
    mode: "readwrite",
  });
  const folder =
    picked.name === FOLDER_NAME
      ? picked
      : await picked.getDirectoryHandle(FOLDER_NAME, { create: true });
  await rememberFolder(folder);
  return folder;
}

/** Pide la carpeta mientras el clic del cobro sigue vigente. */
export async function prepareReceiptFolder(): Promise<void> {
  if (!canPickFolder()) return;
  try {
    await receiptsRoot();
  } catch {
    // Si la persona cancela, el PDF igual se descarga.
  }
}

async function saveInDocuments(payment: ReceiptPayment, pdf: Blob): Promise<boolean> {
  if (!canPickFolder()) return false;
  const root = await receiptsRoot();
  const day = await root.getDirectoryHandle(receiptDay(payment.issued_at), { create: true });
  const file = await day.getFileHandle(`${payment.receipt_number}.pdf`, { create: true });
  const writable = await file.createWritable();
  await writable.write(pdf);
  await writable.close();
  return true;
}

function money(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}

/** Recibo de 80 mm. Los precios ya incluyen IVA; no se desglosa. */
export async function downloadReceipt(
  payment: ReceiptPayment,
): Promise<"documentos" | "descargas"> {
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

  const pdf = doc.output("blob");
  try {
    if (await saveInDocuments(payment, pdf)) return "documentos";
  } catch {
    // La carpeta no estaba disponible. El archivo se descarga igual.
  }
  doc.save(`${payment.receipt_number}.pdf`);
  return "descargas";
}
