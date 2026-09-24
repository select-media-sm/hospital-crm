import * as XLSX from "xlsx";

export function downloadExcel(filename, sheetName, rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
  XLSX.writeFile(wb, filename);
}

// Multi-sheet workbook: sheets = [{ name, rows: [[...], ...] }] (first row is the header).
export function downloadWorkbook(filename, sheets) {
  const wb = XLSX.utils.book_new();
  const used = new Set();
  sheets.forEach((sh, i) => {
    let name = (sh.name || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || `Sheet${i + 1}`;
    while (used.has(name)) name = name.slice(0, 28) + " " + i;
    used.add(name);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sh.rows), name);
  });
  XLSX.writeFile(wb, filename);
}

export function downloadCSV(filename, rows) {
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(rows));
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Reads a .csv, .xlsx or .xls file and returns an array of row objects
// keyed by the header row.
export function readSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const headers = rows.length ? Object.keys(rows[0]) : [];
        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}
