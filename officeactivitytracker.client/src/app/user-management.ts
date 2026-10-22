import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
  divisionId: number | null;
  divisionName: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.css'],
  standalone: false
})
export class UserManagement implements OnInit {
  users: User[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.http.get<User[]>('/api/users').subscribe({
      next: (data: User[]) => {
        console.log('Users received from API:', data);

        this.users = data;
        this.isLoading = false;

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('User API request failed:', error);

        this.users = [];
        this.isLoading = false;

        if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to the server. Check whether the backend is running.';
        } else if (error.status === 404) {
          this.errorMessage = 'The users API endpoint was not found.';
        } else {
          this.errorMessage =
            `Unable to load users. HTTP status: ${error.status}.`;
        }

        this.cdr.detectChanges();
      }
    });
  }

  getActiveUsersCount(): number {
    return this.users.filter(user => user.isActive).length;
  }

  getEmployeesCount(): number {
    return this.users.filter(user => user.role === 'Employee').length;
  }

  getDivisionalHeadsCount(): number {
    return this.users.filter(
      user =>
        user.role === 'DivisionalHead1' ||
        user.role === 'DivisionalHead2'
    ).length;
  }

  goToDashboard(): void {
    this.router.navigateByUrl('/admin');
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigateByUrl('/');
  }
}
