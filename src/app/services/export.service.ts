import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  exportToCSV(transactions: Transaction[], filename = 'transactions'): void {
    const headers = ['Date', 'Title', 'Category', 'Type', 'Amount', 'Notes'];
    const rows = transactions
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => [
        t.date,
        '"' + t.title.replace(/"/g, '""') + '"',
        t.category,
        t.type,
        t.amount.toFixed(2),
        '"' + (t.notes || '').replace(/"/g, '""') + '"',
      ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    this.downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      filename + '.csv',
    );
  }

  exportToPDF(transactions: Transaction[], title = 'Expense Report'): void {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        const sorted = [...transactions].sort((a, b) =>
          a.date.localeCompare(b.date),
        );

        const totalIncome = sorted
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + t.amount, 0);
        const totalExpense = sorted
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + t.amount, 0);

        doc.setFillColor(15, 14, 20);
        doc.rect(0, 0, 220, 40, 'F');
        doc.setTextColor(245, 158, 11);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 14, 18);
        doc.setTextColor(180, 180, 200);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Generated: ' + new Date().toLocaleDateString(), 14, 28);
        doc.text('Total Transactions: ' + sorted.length, 14, 35);

        doc.setTextColor(60, 60, 80);
        doc.setFontSize(10);
        doc.setFillColor(230, 248, 240);
        doc.roundedRect(14, 46, 54, 16, 3, 3, 'F');
        doc.setTextColor(10, 100, 60);
        doc.text('Income', 41, 53, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text('Rs. ' + totalIncome.toFixed(2), 41, 59, { align: 'center' });

        doc.setFillColor(252, 232, 232);
        doc.roundedRect(74, 46, 54, 16, 3, 3, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(139, 30, 30);
        doc.text('Expenses', 101, 53, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text('Rs. ' + totalExpense.toFixed(2), 101, 59, {
          align: 'center',
        });

        const net = totalIncome - totalExpense;
        doc.setFillColor(
          net >= 0 ? 230 : 252,
          net >= 0 ? 248 : 232,
          net >= 0 ? 240 : 232,
        );
        doc.roundedRect(134, 46, 54, 16, 3, 3, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(
          net >= 0 ? 10 : 139,
          net >= 0 ? 100 : 30,
          net >= 0 ? 60 : 30,
        );
        doc.text('Net Balance', 161, 53, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text('Rs. ' + net.toFixed(2), 161, 59, { align: 'center' });

        autoTable(doc, {
          head: [['Date', 'Title', 'Category', 'Type', 'Amount', 'Notes']],
          body: sorted.map((t) => [
            t.date,
            t.title,
            t.category,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            'Rs. ' + t.amount.toFixed(2),
            t.notes || '',
          ]),
          startY: 72,
          headStyles: {
            fillColor: [245, 158, 11],
            textColor: [15, 14, 20],
            fontStyle: 'bold',
          },
          alternateRowStyles: { fillColor: [248, 248, 252] },
          columnStyles: { 4: { halign: 'right' } },
          styles: { fontSize: 9, cellPadding: 3 },
        });

        doc.save(title.replace(/\s+/g, '_').toLowerCase() + '.pdf');
      });
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
