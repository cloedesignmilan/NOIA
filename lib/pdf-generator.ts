import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportTableToPDF = (
    title: string,
    columns: string[],
    rows: any[][],
    filename: string = 'export.pdf'
) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString('it-IT', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Generato il: ${dateStr}`, 14, 30);

    // Table
    autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 40,
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [22, 163, 74], // Green (Emerald 600 approx) for header
            textColor: 255,
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
    });

    doc.save(filename);
};
