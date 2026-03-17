import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { ExportService } from '../../services/export.service';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../models/transaction.model';

type SortField = 'date' | 'amount' | 'title';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionFormComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {
  svc    = inject(TransactionService);
  private expSvc = inject(ExportService);

  // ─── Filter state ─────────────────────────────────────────────────────────
  search    = signal('');
  typeFilter = signal<'all' | 'income' | 'expense'>('all');
  catFilter  = signal('');
  sortField  = signal<SortField>('date');
  sortDir    = signal<SortDir>('desc');

  // ─── Modal state ─────────────────────────────────────────────────────────
  showForm        = signal(false);
  editTransaction = signal<Transaction | null>(null);
  deleteConfirmId = signal<string | null>(null);

  allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  filtered = computed(() => {
    let list = [...this.svc.transactions()];
    const q   = this.search().toLowerCase().trim();
    const typ = this.typeFilter();
    const cat = this.catFilter();

    if (q)   list = list.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    if (typ !== 'all') list = list.filter(t => t.type === typ);
    if (cat) list = list.filter(t => t.category === cat);

    const field = this.sortField();
    const dir   = this.sortDir() === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (field === 'date')   return dir * a.date.localeCompare(b.date);
      if (field === 'amount') return dir * (a.amount - b.amount);
      if (field === 'title')  return dir * a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  });

  totalFiltered = computed(() =>
    this.filtered().reduce((s, t) =>
      t.type === 'income' ? { ...s, income: s.income + t.amount } : { ...s, expense: s.expense + t.amount },
      { income: 0, expense: 0 })
  );

  openAdd(): void {
    this.editTransaction.set(null);
    this.showForm.set(true);
  }

  openEdit(t: Transaction): void {
    this.editTransaction.set(t);
    this.showForm.set(true);
  }

  onSaved(data: Omit<Transaction, 'id'>): void {
    const ed = this.editTransaction();
    if (ed) {
      this.svc.updateTransaction(ed.id, data);
    } else {
      this.svc.addTransaction(data);
    }
    this.showForm.set(false);
  }

  onCancelled(): void {
    this.showForm.set(false);
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  doDelete(): void {
    const id = this.deleteConfirmId();
    if (id) {
      this.svc.deleteTransaction(id);
      this.deleteConfirmId.set(null);
    }
  }

  setSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  clearFilters(): void {
    this.search.set('');
    this.typeFilter.set('all');
    this.catFilter.set('');
  }

  exportCSV(): void {
    this.expSvc.exportToCSV(this.filtered(), 'transactions');
  }

  exportPDF(): void {
    this.expSvc.exportToPDF(this.filtered(), 'Transaction Report');
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }
}
