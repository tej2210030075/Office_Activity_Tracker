import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import { Router } from '@angular/router';
import { timeout } from 'rxjs';

// Logged-in user information
interface LoggedInUser {
  id: number;
  fullName: string;
  username: string;
  role: string;
  divisionId: number | null;
  divisionName: string | null;
}

// Task information returned by the backend API
interface EmployeeTask {
  id: number;
  title: string;
  description: string;
  assignedById: number;
  assignedByName: string;
  assignedToId: number;
  assignedToName: string;
  divisionId: number;
  divisionName: string;
  startDate: string;
  deadline: string;
  priority: string;
  progressPercentage: number;
  status: string;
  createdAt: string;
}

// Request model for updating task progress
interface ProgressUpdateRequest {
  employeeId: number;
  progressPercentage: number;
  remarks: string;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: false,
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboard implements OnInit {

  // Current logged-in employee
  currentUser: LoggedInUser | null = null;

  // Tasks assigned to the employee
  tasks: EmployeeTask[] = [];

  // Loading and saving states
  isLoading = false;
  isSaving = false;

  // Notifications
  errorMessage = '';
  successMessage = '';

  // Progress update modal
  selectedTask: EmployeeTask | null = null;
  updatedProgress = 0;
  remarks = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // Initialize the dashboard
  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      this.router.navigate(['/']);
      return;
    }

    try {
      this.currentUser = JSON.parse(
        storedUser
      ) as LoggedInUser;
    } catch (error: unknown) {
      console.error('Unable to read logged-in user:', error);

      localStorage.removeItem('user');
      this.router.navigate(['/']);
      return;
    }

    if (this.currentUser.role !== 'Employee') {

      if (this.currentUser.role === 'Admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/head-dashboard']);
      }

      return;
    }

    this.loadTasks();
  }

  // Load tasks assigned to the logged-in employee
  loadTasks(): void {

    if (!this.currentUser) {
      this.isLoading = false;

      this.errorMessage =
        'User information is missing. Please log in again.';

      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const employeeId = this.currentUser.id;

    console.log(
      'Loading tasks for employee:',
      employeeId
    );

    this.cdr.detectChanges();

    this.http
      .get<EmployeeTask[]>(
        `/api/tasks/employee/${employeeId}`
      )
      .pipe(timeout(15000))
      .subscribe({

        // Successful response
        next: (response: EmployeeTask[]) => {

          console.log(
            'Employee tasks API response:',
            response
          );

          this.tasks = Array.isArray(response)
            ? response
            : [];

          this.isLoading = false;
          this.errorMessage = '';

          console.log(
            'Tasks loaded:',
            this.tasks.length
          );

          console.log(
            'Current task data:',
            this.tasks
          );

          // Explicitly refresh the dashboard view
          this.cdr.detectChanges();
        },

        // Failed response
        error: (error: unknown) => {

          console.error(
            'Failed to load employee tasks:',
            error
          );

          this.tasks = [];
          this.isLoading = false;

          if (this.isTimeoutError(error)) {

            this.errorMessage =
              'The request timed out. Please check your connection and try again.';

          } else if (
            error instanceof HttpErrorResponse &&
            error.status === 0
          ) {

            this.errorMessage =
              'Cannot connect to the server. Check whether the backend is running.';

          } else if (error instanceof HttpErrorResponse) {

            this.errorMessage =
              `Unable to load tasks. HTTP status: ${error.status}.`;

          } else {

            this.errorMessage =
              'An unexpected error occurred while loading tasks.';
          }

          // Refresh the view to display the error
          this.cdr.detectChanges();
        }
      });
  }

  // Identify RxJS timeout errors safely
  private isTimeoutError(
    error: unknown
  ): boolean {

    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TimeoutError'
    );
  }

  // Open the progress update modal
  openProgressEditor(
    task: EmployeeTask
  ): void {

    this.selectedTask = task;

    this.updatedProgress =
      task.progressPercentage;

    this.remarks = '';
    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();
  }

  // Close the progress update modal
  cancelProgressUpdate(): void {

    if (this.isSaving) {
      return;
    }

    this.selectedTask = null;
    this.updatedProgress = 0;
    this.remarks = '';
    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  // Save the employee's task progress
  updateProgress(): void {

    if (
      !this.currentUser ||
      !this.selectedTask
    ) {

      this.errorMessage =
        'User or task information is missing.';

      return;
    }

    if (this.isSaving) {
      return;
    }

    const progress = Number(
      this.updatedProgress
    );

    // Validate progress percentage
    if (
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100
    ) {

      this.errorMessage =
        'Progress must be a whole number between 0 and 100.';

      return;
    }

    const taskId = this.selectedTask.id;

    const request: ProgressUpdateRequest = {
      employeeId: this.currentUser.id,
      progressPercentage: progress,
      remarks: this.remarks.trim()
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log(
      'Submitting progress update:',
      {
        taskId,
        request
      }
    );

    this.cdr.detectChanges();

    this.http
      .put(
        `/api/tasks/${taskId}/progress`,
        request
      )
      .pipe(timeout(15000))
      .subscribe({

        // Progress saved successfully
        next: (response: unknown) => {

          console.log(
            'Progress update successful:',
            response
          );

          this.isSaving = false;
          this.selectedTask = null;
          this.remarks = '';

          this.successMessage =
            'Task progress updated successfully!';

          this.cdr.detectChanges();

          // Reload tasks to display the latest progress
          this.loadTasks();
        },

        // Handle progress update errors
        error: (error: unknown) => {

          console.error(
            'Failed to update task progress:',
            error
          );

          this.isSaving = false;

          if (this.isTimeoutError(error)) {

            this.errorMessage =
              'The server did not respond within 15 seconds. Check the backend logs and database.';

          } else if (
            error instanceof HttpErrorResponse
          ) {

            if (error.status === 0) {

              this.errorMessage =
                'Cannot connect to the server. Check the backend and Angular proxy.';

            } else if (error.status === 400) {

              this.errorMessage =
                error.error?.message ||
                error.error?.title ||
                'The server rejected the progress information.';

            } else if (
              error.status === 401 ||
              error.status === 403
            ) {

              this.errorMessage =
                'You are not authorized to update this task.';

            } else if (error.status === 404) {

              this.errorMessage =
                'The task or progress-update endpoint was not found.';

            } else if (error.status >= 500) {

              this.errorMessage =
                'The backend encountered an error while saving progress. Check the Visual Studio output.';

            } else {

              this.errorMessage =
                error.error?.message ||
                error.error?.title ||
                `Progress update failed. HTTP status: ${error.status}.`;
            }

          } else {

            this.errorMessage =
              'An unexpected error occurred while updating progress.';
          }

          this.cdr.detectChanges();
        }
      });
  }

  // Get the number of completed tasks
  getCompletedTasks(): number {

    return this.tasks.filter(
      task => task.progressPercentage === 100
    ).length;
  }

  // Get the number of tasks in progress
  getInProgressTasks(): number {

    return this.tasks.filter(
      task =>
        task.progressPercentage > 0 &&
        task.progressPercentage < 100
    ).length;
  }

  // Get the number of pending tasks
  getPendingTasks(): number {

    return this.tasks.filter(
      task => task.progressPercentage === 0
    ).length;
  }

  // Calculate average task completion
  getOverallProgress(): number {

    if (this.tasks.length === 0) {
      return 0;
    }

    const totalProgress = this.tasks.reduce(
      (total, task) =>
        total + task.progressPercentage,
      0
    );

    return Math.round(
      totalProgress / this.tasks.length
    );
  }

  // Return the appropriate progress CSS class
  getProgressClass(
    progress: number
  ): string {

    if (progress === 100) {
      return 'completed';
    }

    if (progress > 0) {
      return 'in-progress';
    }

    return 'pending';
  }

  // Return a readable task status
  getStatusLabel(
    task: EmployeeTask
  ): string {

    if (task.progressPercentage === 100) {
      return 'Completed';
    }

    if (task.progressPercentage > 0) {
      return 'In Progress';
    }

    return 'Pending';
  }

  // Check whether a task has passed its deadline
  isOverdue(
    task: EmployeeTask
  ): boolean {

    if (task.progressPercentage === 100) {
      return false;
    }

    const deadline = new Date(task.deadline);
    const today = new Date();

    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return deadline < today;
  }

  // Refresh the task list manually
  refreshTasks(): void {

    if (this.isLoading) {
      return;
    }

    this.successMessage = '';
    this.loadTasks();
  }

  // Log out the current user
  logout(): void {

    localStorage.removeItem('user');

    this.router.navigate(['/']);
  }
}
