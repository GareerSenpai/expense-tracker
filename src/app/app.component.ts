import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  sidebarOpen = signal(true);
  today = new Date();

  navItems: NavItem[] = [
    { path: '/dashboard',    label: 'Dashboard',    icon: 'grid' },
    { path: '/transactions', label: 'Transactions', icon: 'swap' },
    { path: '/reports',      label: 'Reports',      icon: 'chart' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }
}
