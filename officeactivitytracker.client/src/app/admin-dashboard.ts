import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./app.css'],
  standalone: false
})
export class AdminDashboard {

  fullName = 'Administrator';

  constructor(private router: Router) {
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.fullName = user.fullName || 'Administrator';
      } catch {
        this.fullName = 'Administrator';
      }
    }
  }

  goToUsers(): void {
    this.router.navigateByUrl('/admin/users');
  }

  goToDivisions(): void {
    this.router.navigateByUrl('/admin/divisions');
  }

  goToTasks(): void {
    this.router.navigateByUrl('/admin/tasks');
  }

  goToProgress(): void {
    this.router.navigateByUrl('/admin/progress');
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigateByUrl('/');
  }
}
