import { Injectable, signal, computed } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { INITIAL_TRANSACTIONS } from '../data/transactions.data';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private _transactions = signal<Transaction[]>(INITIAL_TRANSACTIONS);

  readonly transactions = this._transactions.asReadonly();

  readonly totalIncome = computed(() =>
    this._transactions()
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
  );

  readonly totalExpenses = computed(() =>
    this._transactions()
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
  );

  readonly balance = computed(() => this.totalIncome() - this.totalExpenses());

  readonly savingsRate = computed(() => {
    const inc = this.totalIncome();
    return inc > 0 ? ((inc - this.totalExpenses()) / inc) * 100 : 0;
  });

  addTransaction(txn: Omit<Transaction, 'id'>): void {
    const newTxn: Transaction = { ...txn, id: Date.now().toString() };
    this._transactions.update(list => [newTxn, ...list]);
  }

  updateTransaction(id: string, txn: Omit<Transaction, 'id'>): void {
    this._transactions.update(list =>
      list.map(t => t.id === id ? { ...txn, id } : t)
    );
  }

  deleteTransaction(id: string): void {
    this._transactions.update(list => list.filter(t => t.id !== id));
  }

  getByMonth(year: number, month: number): Transaction[] {
    return this._transactions().filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  getMonthsWithData(): { year: number; month: number; label: string }[] {
    const set = new Set<string>();
    this._transactions().forEach(t => {
      const d = new Date(t.date);
      set.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    return Array.from(set)
      .sort()
      .map(key => {
        const [y, m] = key.split('-').map(Number);
        const d = new Date(y, m, 1);
        return {
          year: y, month: m,
          label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
        };
      });
  }
}
