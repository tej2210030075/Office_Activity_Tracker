import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface DivisionEmployee {
  id: number;
  fullName: string;
  username: string;
  isActive: boolean;
}

interface Division {
  id: number;
  name: string;
  headUserId: number | null;
  headName: string;
  employeeCount: number;
  employees: DivisionEmployee[];
}

@Component({
  selector: 'app-division-management',
  templateUrl: './division-management.html',
  styleUrls: ['./division-management.css'],
  standalone: false
})
export class DivisionManagement implements OnInit {

  divisions: Division[] = [];
  totalDivisions = 0;
  totalEmployees = 0;

  isLoading = true;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDivisions();
  }

  loadDivisions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<Division[]>('/api/divisions').subscribe({

      next: (data: Division[]) => {
        console.log('Divisions received:', data);

        this.divisions = data ?? [];
        this.totalDivisions = this.divisions.length;

        this.totalEmployees = this.divisions.reduce(
          (total, division) =>
            total + (division.employees?.length ?? 0),
          0
        );

        this.isLoading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Division API error:', error);

        this.errorMessage =
          error.status === 0
            ? 'Cannot connect to the backend server.'
            : `Unable to load divisions. HTTP status: ${error.status}.`;

        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToDashboard(): void {
    this.router.navigateByUrl('/admin');
  }

  goToUsers(): void {
    this.router.navigateByUrl('/admin/users');
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigateByUrl('/');
  }
}
