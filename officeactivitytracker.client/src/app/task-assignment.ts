import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { timeout, finalize } from 'rxjs';

interface Employee {
  id: number;
  fullName: string;
  username: string;
  role: string;
  divisionId: number;
  divisionName?: string;
  isActive: boolean;
}

interface CreateTaskRequest {
  title: string;
  description: string;
  assignedById: number;
  assignedToId: number;
  divisionId: number;
  startDate: string;
  deadline: string;
  priority: string;
}

@Component({
  selector: 'app-task-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './task-assignment.html',
  styleUrls: ['./task-assignment.css']
})
export class TaskAssignment implements OnInit {

  user: any = null;

  employees: Employee[] = [];

  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  title = '';
  description = '';
  assignedToId: number | null = null;
  startDate = '';
  deadline = '';
  priority = 'Medium';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Initialize the page
  ngOnInit(): void {

    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      this.router.navigateByUrl('/login');
      return;
    }

    try {
      this.user = JSON.parse(storedUser);
    } catch (error) {
      console.error('Unable to parse login information:', error);

      localStorage.removeItem('user');
      this.router.navigateByUrl('/login');
      return;
    }

    // Only divisional heads can assign tasks
    if (
      this.user.role !== 'DivisionalHead1' &&
      this.user.role !== 'DivisionalHead2'
    ) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadEmployees();
  }

  // Current user's division
  get divisionId(): number {
    return Number(
      this.user?.divisionId ??
      this.user?.DivisionId ??
      0
    );
  }

  // Load active employees belonging to the current division
  loadEmployees(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<Employee[]>('/api/users')
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({

        next: (users: Employee[]) => {

          this.employees = users.filter(employee =>
            employee.role === 'Employee' &&
            employee.isActive &&
            Number(employee.divisionId) === this.divisionId
          );

          if (this.employees.length === 0) {
            this.errorMessage =
              'No active employees were found in your division.';
          }
        },

        error: (err: any) => {

          console.error('Unable to load employees:', err);

          if (err?.name === 'TimeoutError') {
            this.errorMessage =
              'The server took too long to load employees. Please check the backend.';
          } else if (err?.status === 0) {
            this.errorMessage =
              'Cannot connect to the server. Ensure the backend is running.';
          } else {
            this.errorMessage =
              `Unable to load employees. HTTP status: ${err?.status ?? 'unknown'}.`;
          }
        }

      });
  }

  // Assign a new task
  assignTask(): void {

    // Prevent multiple submissions
    if (this.isSaving) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    // Validate task title
    if (!this.title.trim()) {
      this.errorMessage = 'Please enter a task title.';
      return;
    }

    // Validate employee selection
    if (!this.assignedToId) {
      this.errorMessage = 'Please select an employee.';
      return;
    }

    // Validate dates
    if (!this.startDate || !this.deadline) {
      this.errorMessage =
        'Please select both the start date and deadline.';
      return;
    }

    if (this.deadline < this.startDate) {
      this.errorMessage =
        'The deadline cannot be before the start date.';
      return;
    }

    // Confirm that the employee belongs to this division
    const selectedEmployee = this.employees.find(
      employee => employee.id === Number(this.assignedToId)
    );

    if (!selectedEmployee) {
      this.errorMessage =
        'Please select a valid employee from your division.';
      return;
    }

    // Get the logged-in divisional head's ID
    const assignedById = Number(
      this.user?.id ??
      this.user?.Id ??
      0
    );

    if (!assignedById || !this.divisionId) {
      this.errorMessage =
        'Your user ID or division information is missing. Please log in again.';
      return;
    }

    // Prepare the API request
    const request: CreateTaskRequest = {
      title: this.title.trim(),
      description: this.description.trim(),
      assignedById: assignedById,
      assignedToId: Number(this.assignedToId),
      divisionId: this.divisionId,
      startDate: this.startDate,
      deadline: this.deadline,
      priority: this.priority
    };

    console.log('Submitting task assignment:', request);

    this.isSaving = true;

    this.http
      .post('/api/tasks', request)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({

        // Task created successfully
        next: (response: any) => {

          console.log('Task assignment successful:', response);

          this.successMessage =
            'Task assigned successfully!';

          this.errorMessage = '';

          // Clear the form
          this.title = '';
          this.description = '';
          this.assignedToId = null;
          this.startDate = '';
          this.deadline = '';
          this.priority = 'Medium';
        },

        // Handle errors without TypeScript type conflicts
        error: (err: any) => {

          console.error('Task assignment failed:', err);

          if (err?.name === 'TimeoutError') {

            this.errorMessage =
              'The server did not respond within 15 seconds. ' +
              'Check the backend logs before trying again.';

          } else if (err?.status === 0) {

            this.errorMessage =
              'Cannot connect to the backend server. ' +
              'Ensure OfficeActivityTracker.Server is running.';

          } else if (err?.status === 400) {

            this.errorMessage =
              err.error?.message ||
              err.error?.title ||
              'Invalid task details. Verify the employee, division, and dates.';

          } else if (err?.status === 401) {

            this.errorMessage =
              'Your session is unauthorized. Please log in again.';

          } else if (err?.status === 403) {

            this.errorMessage =
              'You do not have permission to assign this task.';

          } else if (err?.status === 404) {

            this.errorMessage =
              'The task assignment API was not found. Check the backend route.';

          } else if (err?.status >= 500) {

            this.errorMessage =
              'The backend encountered an error. Check the server console and database connection.';

          } else {

            this.errorMessage =
              err.error?.message ||
              err.error?.title ||
              `Task assignment failed. HTTP status: ${err?.status ?? 'unknown'}.`;
          }
        }

      });
  }

  // Return to the divisional head dashboard
  goBack(): void {
    this.router.navigateByUrl('/head-dashboard');
  }

}
