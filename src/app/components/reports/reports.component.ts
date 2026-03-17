import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { TransactionService } from '../../services/transaction.service';
import { ExportService } from '../../services/export.service';
import { CATEGORY_COLORS } from '../../models/transaction.model';

Chart.register(...registerables);

type ReportPeriod = 'monthly' | 'weekly';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('trendCanvas') trendRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('catCanvas') catRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incExpCanvas') incExpRef!: ElementRef<HTMLCanvasElement>;

  svc = inject(TransactionService);
  private expSvc = inject(ExportService);
  private charts: Chart[] = [];

  period = signal<ReportPeriod>('monthly');
  activeYear = signal<number>(2025);

  readonly months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  monthlyData = computed(() => {
    return this.months.map((label, i) => {
      const txns = this.svc.getByMonth(this.activeYear(), i);
      const income = txns
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = txns
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return { label, income, expense, net: income - expense };
    });
  });

  weeklyData = computed(() => {
    const allTxns = this.svc
      .transactions()
      .filter((t) => new Date(t.date).getFullYear() === this.activeYear());
    const map = new Map<string, { income: number; expense: number }>();
    allTxns.forEach((t) => {
      const d = new Date(t.date);
      const startOfYear = new Date(this.activeYear(), 0, 1);
      const week = Math.ceil(
        ((d.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7,
      );
      const key = `W${String(week).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
      const entry = map.get(key)!;
      if (t.type === 'income') entry.income += t.amount;
      else entry.expense += t.amount;
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, d]) => ({ label, ...d, net: d.income - d.expense }));
  });

  currentData = computed(() =>
    this.period() === 'monthly' ? this.monthlyData() : this.weeklyData(),
  );

  categoryBreakdown = computed(() => {
    const txns = this.svc
      .transactions()
      .filter(
        (t) =>
          t.type === 'expense' &&
          new Date(t.date).getFullYear() === this.activeYear(),
      );
    const map = new Map<string, number>();
    txns.forEach((t) =>
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount),
    );
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([cat, amt]) => ({
        cat,
        amt,
        pct: total > 0 ? (amt / total) * 100 : 0,
        color: (CATEGORY_COLORS as Record<string, string>)[cat] ?? '#888',
      }))
      .sort((a, b) => b.amt - a.amt);
  });

  summaryStats = computed(() => {
    const data = this.currentData().filter(
      (d) => d.income > 0 || d.expense > 0,
    );
    const totalIncome = data.reduce((s, d) => s + d.income, 0);
    const totalExpense = data.reduce((s, d) => s + d.expense, 0);
    const avgExpense = data.length > 0 ? totalExpense / data.length : 0;
    const bestPeriod = data.reduce((best, d) => (d.net > best.net ? d : best), {
      label: '—',
      net: -Infinity,
      income: 0,
      expense: 0,
    });
    return {
      totalIncome,
      totalExpense,
      avgExpense,
      bestPeriod: bestPeriod.label,
      netSavings: totalIncome - totalExpense,
    };
  });

  ngAfterViewInit(): void {
    setTimeout(() => this.buildAllCharts(), 80);
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  rebuildCharts(): void {
    this.destroyCharts();
    setTimeout(() => this.buildAllCharts(), 40);
  }

  private buildAllCharts(): void {
    this.buildTrend();
    this.buildCategoryBar();
    this.buildIncExpLine();
  }

  private buildTrend(): void {
    const data = this.currentData();
    const c = new Chart(this.trendRef.nativeElement, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Income',
            data: data.map((d) => d.income),
            backgroundColor: 'rgba(16,185,129,0.7)',
            borderRadius: 5,
            borderSkipped: false as const,
          },
          {
            label: 'Expenses',
            data: data.map((d) => d.expense),
            backgroundColor: 'rgba(239,68,68,0.7)',
            borderRadius: 5,
            borderSkipped: false as const,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#7a84a0', font: { size: 11 } },
            border: { color: 'rgba(255,255,255,0.07)' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#7a84a0',
              callback: (v) => 'Rs. ' + Number(v).toLocaleString(),
            },
            border: { color: 'rgba(255,255,255,0.07)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1e2e',
            titleColor: '#e8eaf2',
            bodyColor: '#7a84a0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          },
        },
      },
    });
    this.charts.push(c);
  }

  private buildCategoryBar(): void {
    const cats = this.categoryBreakdown().slice(0, 8);
    const c = new Chart(this.catRef.nativeElement, {
      type: 'bar',
      data: {
        labels: cats.map((c) => c.cat),
        datasets: [
          {
            label: 'Amount',
            data: cats.map((c) => c.amt),
            backgroundColor: cats.map((c) => c.color),
            borderRadius: 5,
            borderSkipped: false as const,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#7a84a0',
              callback: (v) => 'Rs. ' + Number(v).toLocaleString(),
            },
            border: { color: 'rgba(255,255,255,0.07)' },
          },
          y: {
            grid: { color: 'transparent' },
            ticks: { color: '#7a84a0', font: { size: 11 } },
            border: { color: 'rgba(255,255,255,0.07)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1e2e',
            titleColor: '#e8eaf2',
            bodyColor: '#7a84a0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          },
        },
      },
    });
    this.charts.push(c);
  }

  private buildIncExpLine(): void {
    const data = this.currentData();
    const c = new Chart(this.incExpRef.nativeElement, {
      type: 'line',
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: 'Net Savings',
            data: data.map((d) => d.net),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#f59e0b',
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#7a84a0' },
            border: { color: 'rgba(255,255,255,0.07)' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#7a84a0',
              callback: (v) => 'Rs. ' + Number(v).toLocaleString(),
            },
            border: { color: 'rgba(255,255,255,0.07)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1e2e',
            titleColor: '#e8eaf2',
            bodyColor: '#7a84a0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          },
        },
      },
    });
    this.charts.push(c);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  getFilteredTransactions() {
    return this.svc
      .transactions()
      .filter((t) => new Date(t.date).getFullYear() === this.activeYear());
  }

  exportCSV(): void {
    const filtered = this.getFilteredTransactions();
    this.expSvc.exportToCSV(filtered, `report-${this.activeYear()}`);
  }

  exportPDF(): void {
    const filtered = this.getFilteredTransactions();
    this.expSvc.exportToPDF(filtered, `Annual Report ${this.activeYear()}`);
  }
  formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(n);
  }
}
