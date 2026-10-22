import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Task {
  id: number;
  title: string;
  description?: string;
  assignedToId?: number;
  assignedToName?: string;
  assignedById?: number;
  assignedByName?: string;
  divisionId: number;
  divisionName?: string;
  startDate?: string;
  deadline: string;
  priority: string;
  status: string;
  progressPercentage: number;
}

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
  divisionId: number;
  divisionName?: string;
}

@Component({
  selector: 'app-head-dashboard',
  standalone: false,
  templateUrl: './head-dashboard.html',
  styleUrl: './head-dashboard.css'
})
export class HeadDashboard implements OnInit {

  user: User | null = null;
  tasks: Task[] = [];

  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      this.router.navigateByUrl('/login');
      return;
    }

    try {
      this.user = JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem('user');
      this.router.navigateByUrl('/login');
      return;
    }

    if (
      this.user.role !== 'DivisionalHead1' &&
      this.user.role !== 'DivisionalHead2'
    ) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadTasks();
  }

  loadTasks(): void {
    if (!this.user) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<Task[]>(`/api/tasks?divisionId=${this.user.divisionId}`)
      .subscribe({
        next: (data) => {
          this.tasks = data ?? [];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading tasks:', error);

          this.errorMessage =
            error.error?.message ??
            'Unable to load tasks. Please check whether the backend server is running.';

          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Dashboard summary calculations

  get totalTasks(): number {
    return this.tasks.length;
  }

  get completedTasks(): number {
    return this.tasks.filter(
      task =>
        task.status?.toLowerCase() === 'completed' ||
        task.progressPercentage >= 100
    ).length;
  }

  get pendingTasks(): number {
    return this.tasks.filter(
      task =>
        task.status?.toLowerCase() === 'pending' &&
        task.progressPercentage < 100
    ).length;
  }

  get inProgressTasks(): number {
    return this.tasks.filter(
      task =>
        task.progressPercentage > 0 &&
        task.progressPercentage < 100
    ).length;
  }

  get averageProgress(): number {
    if (this.tasks.length === 0) {
      return 0;
    }

    const totalProgress = this.tasks.reduce(
      (total, task) => total + (task.progressPercentage || 0),
      0
    );

    return Math.round(totalProgress / this.tasks.length);
  }

  // Navigate to the task assignment page

  goToTaskAssignment(): void {
    this.router.navigateByUrl('/task-assignment');
  }

  // Keep this method if your existing dashboard uses task management

  goToTaskManagement(): void {
    this.router.navigateByUrl('/admin/tasks');
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigateByUrl('/login');
  }
}
