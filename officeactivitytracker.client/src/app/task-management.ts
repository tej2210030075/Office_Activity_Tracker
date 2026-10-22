import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface LoggedInUser {
  id: number;
  fullName: string;
  username: string;
  role: string;
  divisionId: number | null;
  divisionName: string | null;
}

interface Employee {
  id: number;
  fullName: string;
  username: string;
  role: string;
  divisionId: number | null;
  isActive?: boolean;
}

interface Division {
  id: number;
  name: string;
}

interface Task {
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
  selector: 'app-task-management',
  standalone: false,
  templateUrl: './task-management.html',
  styleUrl: './task-management.css'
})
export class TaskManagement implements OnInit {

  currentUser: LoggedInUser | null = null;

  users: Employee[] = [];
  divisions: Division[] = [];
  tasks: Task[] = [];

  availableEmployees: Employee[] = [];
  availableDivisions: Division[] = [];

  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  form = {
    title: '',
    description: '',
    divisionId: 0,
    assignedToId: 0,
    startDate: '',
    deadline: '',
    priority: 'Medium'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {

    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      this.router.navigate(['/']);
      return;
    }

    try {
      this.currentUser = JSON.parse(storedUser) as LoggedInUser;
    } catch {
      localStorage.removeItem('user');
      this.router.navigate(['/']);
      return;
    }

    const role = this.currentUser.role;

    if (
      role !== 'Admin' &&
      role !== 'DivisionalHead1' &&
      role !== 'DivisionalHead2'
    ) {
      this.router.navigate(['/']);
      return;
    }

    this.initializeForm();
    this.loadInitialData();
  }

  // Initialize the task creation form.
  initializeForm(): void {

    if (
      this.currentUser?.role === 'DivisionalHead1' ||
      this.currentUser?.role === 'DivisionalHead2'
    ) {
      this.form.divisionId = this.currentUser.divisionId ?? 0;
      this.form.startDate = this.getToday();
    } else {
      this.form.startDate = this.getToday();
    }

    this.form.priority = 'Medium';

    this.onDivisionChange();
  }

  // Format today's date for an HTML date input.
  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Load users, divisions, and tasks.
  loadInitialData(): void {

    this.ngZone.run(() => {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();
    });

    this.loadUsers();
    this.loadDivisions();
    this.loadTasks();
  }

  // Load users from the backend.
  loadUsers(): void {

    console.log('Loading users...');

    this.http.get<Employee[]>('/api/users').subscribe({

      next: (response) => {

        this.ngZone.run(() => {

          this.users = Array.isArray(response) ? [...response] : [];

          console.log('Users loaded:', this.users.length);

          this.onDivisionChange();
          this.cdr.detectChanges();
        });
      },

      error: (error) => {

        console.error('Failed to load users:', error);

        this.ngZone.run(() => {

          this.errorMessage =
            'Unable to load users. Please check the backend.';

          this.cdr.detectChanges();
        });
      }
    });
  }

  // Load divisions from the backend.
  loadDivisions(): void {

    console.log('Loading divisions...');

    this.http.get<Division[]>('/api/divisions').subscribe({

      next: (response) => {

        this.ngZone.run(() => {

          this.divisions = Array.isArray(response)
            ? [...response]
            : [];

          if (this.currentUser?.role === 'Admin') {

            this.availableDivisions = [...this.divisions];

          } else {

            this.availableDivisions = this.divisions.filter(
              division => division.id === this.currentUser?.divisionId
            );
          }

          console.log(
            'Divisions loaded:',
            this.divisions.length
          );

          this.onDivisionChange();
          this.cdr.detectChanges();
        });
      },

      error: (error) => {

        console.error('Failed to load divisions:', error);

        this.ngZone.run(() => {

          this.errorMessage =
            'Unable to load divisions. Please check the backend.';

          this.cdr.detectChanges();
        });
      }
    });
  }

  // Load tasks and explicitly refresh the view.
  loadTasks(): void {

    let url = '/api/tasks';

    if (this.currentUser?.role !== 'Admin') {

      const divisionId = Number(this.currentUser?.divisionId);

      if (!divisionId) {

        this.ngZone.run(() => {

          this.tasks = [];
          this.isLoading = false;

          this.errorMessage =
            'Your account is not assigned to a division.';

          this.cdr.detectChanges();
        });

        return;
      }

      url = `/api/tasks?divisionId=${divisionId}`;
    }

    console.log('Loading tasks from:', url);

    this.http.get<Task[]>(url).subscribe({

      next: (response) => {

        console.log('API task response:', response);

        this.ngZone.run(() => {

          this.tasks = Array.isArray(response)
            ? [...response]
            : [];

          this.isLoading = false;

          console.log('Tasks loaded:', this.tasks.length);
          console.log('First task:', this.tasks[0] ?? null);
          console.log('Loading state:', this.isLoading);

          this.cdr.detectChanges();

          console.log(
            'Task view updated:',
            this.tasks.length,
            'tasks'
          );
        });
      },

      error: (error) => {

        console.error('Failed to load tasks:', error);

        this.ngZone.run(() => {

          this.tasks = [];
          this.isLoading = false;

          this.errorMessage =
            error.error?.message ||
            'Unable to load tasks. Please check the backend server.';

          this.cdr.detectChanges();
        });
      }
    });
  }

  // Filter employees according to the selected division.
  onDivisionChange(): void {

    const divisionId = Number(this.form.divisionId);

    if (!divisionId) {
      this.availableEmployees = [];
      this.form.assignedToId = 0;
      return;
    }

    this.availableEmployees = this.users.filter(user => {

      return user.role === 'Employee' &&
        user.divisionId === divisionId &&
        user.isActive !== false;
    });

    const selectedEmployeeExists = this.availableEmployees.some(
      employee => employee.id === Number(this.form.assignedToId)
    );

    if (!selectedEmployeeExists) {
      this.form.assignedToId = 0;
    }
  }

  // Create a task.
  createTask(): void {

    if (!this.currentUser) {
      this.errorMessage = 'Please log in again.';
      return;
    }

    if (
      this.currentUser.role !== 'DivisionalHead1' &&
      this.currentUser.role !== 'DivisionalHead2'
    ) {
      this.errorMessage =
        'Only divisional heads can create tasks.';
      return;
    }

    if (
      !this.form.title.trim() ||
      !this.form.divisionId ||
      !this.form.assignedToId ||
      !this.form.startDate ||
      !this.form.deadline
    ) {
      this.errorMessage =
        'Please complete all required fields.';
      return;
    }

    if (this.form.deadline < this.form.startDate) {
      this.errorMessage =
        'The deadline cannot be earlier than the start date.';
      return;
    }

    if (
      this.currentUser.divisionId !== this.form.divisionId
    ) {
      this.errorMessage =
        'You can only assign tasks within your own division.';
      return;
    }

    const selectedEmployee = this.availableEmployees.find(
      employee => employee.id === Number(this.form.assignedToId)
    );

    if (!selectedEmployee) {
      this.errorMessage =
        'Please select a valid employee in your division.';
      return;
    }

    const request: CreateTaskRequest = {
      title: this.form.title.trim(),
      description: this.form.description.trim(),
      assignedById: this.currentUser.id,
      assignedToId: Number(this.form.assignedToId),
      divisionId: Number(this.form.divisionId),
      startDate: this.form.startDate,
      deadline: this.form.deadline,
      priority: this.form.priority
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<Task>('/api/tasks', request).subscribe({

      next: () => {

        this.ngZone.run(() => {

          this.isSaving = false;

          this.successMessage = 'Task created successfully!';

          this.form.title = '';
          this.form.description = '';
          this.form.assignedToId = 0;
          this.form.startDate = this.getToday();
          this.form.deadline = '';
          this.form.priority = 'Medium';

          this.loadTasks();

          this.cdr.detectChanges();
        });
      },

      error: (error) => {

        console.error('Failed to create task:', error);

        this.ngZone.run(() => {

          this.isSaving = false;

          this.errorMessage =
            error.error?.message ||
            'Unable to create the task. Please try again.';

          this.cdr.detectChanges();
        });
      }
    });
  }

  // Count pending tasks.
  getPendingTasks(): number {

    return this.tasks.filter(
      task => task.progressPercentage === 0
    ).length;
  }

  // Count tasks currently in progress.
  getInProgressTasks(): number {

    return this.tasks.filter(
      task =>
        task.progressPercentage > 0 &&
        task.progressPercentage < 100
    ).length;
  }

  // Count completed tasks.
  getCompletedTasks(): number {

    return this.tasks.filter(
      task => task.progressPercentage === 100
    ).length;
  }

  // Determine the progress bar CSS class.
  getProgressClass(progress: number): string {

    if (progress >= 100) {
      return 'completed';
    }

    if (progress > 0) {
      return 'in-progress';
    }

    return 'pending';
  }

  // Navigate to the appropriate dashboard.
  goToDashboard(): void {

    if (this.currentUser?.role === 'Admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/head-dashboard']);
    }
  }

  // Log out.
  logout(): void {

    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }
}
