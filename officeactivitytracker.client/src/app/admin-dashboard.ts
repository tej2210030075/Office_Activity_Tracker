import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

interface DashboardUser {
  id: number;
  fullName: string;
  username: string;
  role: string;
  divisionId: number | null;
  divisionName: string;
  isActive: boolean;
}

interface DashboardTask {
  id: number;
  title: string;
  description?: string;
  assignedToId: number;
  assignedTo?: {
    fullName: string;
  } | null;
  divisionId: number;
  division?: {
    name: string;
  } | null;
  deadline: string;
  priority: string;
  progressPercentage: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  standalone: false
})
export class AdminDashboard implements OnInit {

  fullName = 'Administrator';

  totalEmployees = 0;
  totalTasks = 0;
  completedTasks = 0;
  overdueTasks = 0;
  overallProgress = 0;

  loadingStatistics = true;
  statisticsError = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        this.fullName = user.fullName || 'Administrator';
      } catch (error) {
        console.error('Unable to read saved user:', error);
        this.fullName = 'Administrator';
      }
    }
  }

  ngOnInit(): void {
    this.loadDashboardStatistics();
  }

  // Load dashboard statistics
  loadDashboardStatistics(): void {

    this.loadingStatistics = true;
    this.statisticsError = '';

    this.cdr.detectChanges();

    console.log('Loading dashboard statistics...');

    // Load users independently
    const usersRequest = this.http
      .get<DashboardUser[]>('/api/users')
      .pipe(
        catchError(error => {
          console.error('Failed to load dashboard users:', error);

          this.statisticsError =
            'Unable to load user statistics. Please check the users API.';

          return of(null);
        })
      );

    // Load tasks independently
    const tasksRequest = this.http
      .get<DashboardTask[]>('/api/tasks')
      .pipe(
        catchError(error => {
          console.error('Failed to load dashboard tasks:', error);

          this.statisticsError =
            this.statisticsError
              ? 'Unable to load user and task statistics. Please check both APIs.'
              : 'Unable to load task statistics. Please check the tasks API.';

          return of(null);
        })
      );

    // Wait for both requests to finish
    forkJoin({
      users: usersRequest,
      tasks: tasksRequest
    })
      .pipe(
        finalize(() => {

          this.loadingStatistics = false;

          console.log(
            'Dashboard loading finished:',
            this.loadingStatistics
          );

          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: ({ users, tasks }) => {

          // Diagnostic information
          console.log('Dashboard users response:', users);
          console.log('Dashboard tasks response:', tasks);

          console.log(
            'Users is an array:',
            Array.isArray(users)
          );

          console.log(
            'Tasks is an array:',
            Array.isArray(tasks)
          );

          // Calculate employee statistics
          if (Array.isArray(users)) {

            this.totalEmployees = users.filter(user =>
              user.isActive &&
              user.role?.toLowerCase() === 'employee'
            ).length;

          } else {
            this.totalEmployees = 0;
          }

          // Calculate task statistics
          if (Array.isArray(tasks)) {

            const now = new Date();

            this.totalTasks = tasks.length;

            // Completed tasks
            this.completedTasks = tasks.filter(task =>
              task.status?.toLowerCase() === 'completed'
            ).length;

            // Overdue tasks
            this.overdueTasks = tasks.filter(task => {

              if (!task.deadline) {
                return false;
              }

              const deadline = new Date(task.deadline);

              return (
                task.status?.toLowerCase() !== 'completed' &&
                !Number.isNaN(deadline.getTime()) &&
                deadline.getTime() < now.getTime()
              );

            }).length;

            // Overall task progress
            this.overallProgress = this.totalTasks > 0
              ? Math.round(
                  tasks.reduce(
                    (total, task) =>
                      total +
                      this.clampProgress(task.progressPercentage),
                    0
                  ) / this.totalTasks
                )
              : 0;

          } else {

            this.totalTasks = 0;
            this.completedTasks = 0;
            this.overdueTasks = 0;
            this.overallProgress = 0;

          }

          // Log final calculated values
          console.log('Calculated dashboard statistics:', {
            totalEmployees: this.totalEmployees,
            totalTasks: this.totalTasks,
            completedTasks: this.completedTasks,
            overdueTasks: this.overdueTasks,
            overallProgress: this.overallProgress
          });

          this.cdr.detectChanges();
        },

        error: error => {

          console.error(
            'Unexpected dashboard statistics error:',
            error
          );

          this.statisticsError =
            'An unexpected error occurred while loading dashboard statistics.';

          this.cdr.detectChanges();
        }

      });

  }

  // Keep progress within the range 0–100
  private clampProgress(value: number): number {

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, value));

  }

  // Navigate to User Management
  goToUsers(): void {
    this.router.navigateByUrl('/admin/users');
  }

  // Navigate to Division Management
  goToDivisions(): void {
    this.router.navigateByUrl('/admin/divisions');
  }

  // Navigate to Task Management
  goToTasks(): void {
    this.router.navigateByUrl('/admin/tasks');
  }

  // Navigate to Progress Monitoring
  goToProgress(): void {
    this.router.navigateByUrl('/admin/progress');
  }

  // Log out
  logout(): void {
    localStorage.removeItem('user');
    this.router.navigateByUrl('/');
  }

}
