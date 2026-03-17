import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./components/transactions/transactions.component').then(m => m.TransactionsComponent)
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./components/reports/reports.component').then(m => m.ReportsComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
