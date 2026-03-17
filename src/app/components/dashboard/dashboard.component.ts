import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, inject, computed
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TransactionService } from '../../services/transaction.service';
import { CATEGORY_COLORS } from '../../models/transaction.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('donutCanvas') donutRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')   barRef!:   ElementRef<HTMLCanvasElement>;

  private svc = inject(TransactionService);
  private donut?: Chart;
  private bar?: Chart;

  transactions  = this.svc.transactions;
  totalIncome   = this.svc.totalIncome;
  totalExpenses = this.svc.totalExpenses;
  balance       = this.svc.balance;
  savingsRate   = this.svc.savingsRate;

  recent = computed(() =>
    [...this.transactions()]
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)
  );

  topCategories = computed(() => {
    const map = new Map<string, number>();
    this.transactions()
      .filter(t => t.type === 'expense')
      .forEach(t => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    const total = this.totalExpenses();
    return Array.from(map.entries())
      .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? (amt / total) * 100 : 0, color: (CATEGORY_COLORS as Record<string,string>)[cat] ?? '#888' }))
      .sort((a,b) => b.amt - a.amt)
      .slice(0, 6);
  });

  ngAfterViewInit(): void {
    setTimeout(() => { this.buildDonut(); this.buildBar(); }, 80);
  }

  private buildDonut(): void {
    const cats = this.topCategories();
    this.donut = new Chart(this.donutRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => c.cat),
        datasets: [{
          data: cats.map(c => c.amt),
          backgroundColor: cats.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '74%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1e2e', titleColor: '#e8eaf2',
            bodyColor: '#7a84a0', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            callbacks: { label: ctx => ' $' + Number(ctx.raw).toFixed(2) }
          }
        }
      }
    });
  }

  private buildBar(): void {
    const months = this.svc.getMonthsWithData();
    const labels  = months.map(m => m.label.replace(',', ''));
    const income  = months.map(m => this.svc.getByMonth(m.year, m.month).filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0));
    const expense = months.map(m => this.svc.getByMonth(m.year, m.month).filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));

    this.bar = new Chart(this.barRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Income',   data: income,  backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 5, borderSkipped: false as const },
          { label: 'Expenses', data: expense, backgroundColor: 'rgba(239,68,68,0.75)',  borderRadius: 5, borderSkipped: false as const }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a84a0' }, border: { color: 'rgba(255,255,255,0.07)' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a84a0', callback: v => '$'+v }, border: { color: 'rgba(255,255,255,0.07)' } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1e2e', titleColor: '#e8eaf2',
            bodyColor: '#7a84a0', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
            callbacks: { label: ctx => ' ' + ctx.dataset.label + ': $' + Number(ctx.raw).toFixed(2) }
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.donut?.destroy();
    this.bar?.destroy();
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }
}
