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

interface Division {
  id: number;
  name: string;
}

interface CreateUserRequest {
  fullName: string;
  username: string;
  password: string;
  role: string;
  divisionId: number | null;
  isActive: boolean;
}

interface UpdateUserRequest {
  fullName: string;
  username: string;
  role: string;
  divisionId: number | null;
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
  divisions: Division[] = [];

  isLoading = false;
  errorMessage = '';

  searchText = '';
  selectedRole = '';
  selectedDivision = '';
  selectedStatus = '';

  // Add User
  showAddUserForm = false;
  isSavingUser = false;

  // Edit User
  showEditUserForm = false;
  isUpdatingUser = false;
  editingUserId: number | null = null;

  successMessage = '';
  formErrorMessage = '';

  newUser: CreateUserRequest = this.createEmptyUser();

  editUser: UpdateUserRequest = this.createEmptyEditUser();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadDivisions();
  }

  private createEmptyUser(): CreateUserRequest {
    return {
      fullName: '',
      username: '',
      password: '',
      role: 'Employee',
      divisionId: null,
      isActive: true
    };
  }

  private createEmptyEditUser(): UpdateUserRequest {
    return {
      fullName: '',
      username: '',
      role: 'Employee',
      divisionId: null,
      isActive: true
    };
  }

  // Load users
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.http.get<User[]>('/api/users').subscribe({
      next: (data: User[]) => {
        console.log('Users received from API:', data);

        this.users = data ?? [];
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

  // Load divisions
  loadDivisions(): void {
    this.http.get<Division[]>('/api/users/divisions').subscribe({
      next: (data: Division[]) => {
        this.divisions = data ?? [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Division API request failed:', error);

        this.formErrorMessage =
          'Unable to load divisions. Please check the backend.';

        this.cdr.detectChanges();
      }
    });
  }

  // Open Add User form
  openAddUserForm(): void {
    this.showEditUserForm = false;
    this.editingUserId = null;

    this.newUser = this.createEmptyUser();
    this.formErrorMessage = '';
    this.successMessage = '';

    this.showAddUserForm = true;
  }

  // Close Add User form
  closeAddUserForm(): void {
    if (this.isSavingUser) {
      return;
    }

    this.showAddUserForm = false;
    this.formErrorMessage = '';

    this.newUser = this.createEmptyUser();
  }

  // Create a user
  saveUser(): void {
    this.formErrorMessage = '';
    this.successMessage = '';

    const fullName = this.newUser.fullName.trim();
    const username = this.newUser.username.trim();
    const password = this.newUser.password;

    if (!fullName || !username || !password) {
      this.formErrorMessage =
        'Please enter the full name, username, and password.';
      return;
    }

    if (
      this.newUser.role !== 'Admin' &&
      this.newUser.divisionId === null
    ) {
      this.formErrorMessage =
        'Please select a division for this user.';
      return;
    }

    const request: CreateUserRequest = {
      ...this.newUser,
      fullName,
      username
    };

    this.isSavingUser = true;
    this.cdr.detectChanges();

    this.http.post('/api/users', request).subscribe({
      next: () => {
        this.isSavingUser = false;
        this.showAddUserForm = false;

        this.successMessage = 'User created successfully!';

        this.newUser = this.createEmptyUser();

        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Create user request failed:', error);

        this.isSavingUser = false;

        if (error.status === 0) {
          this.formErrorMessage =
            'Cannot connect to the server. Please check whether the backend is running.';
        } else if (error.status === 409) {
          this.formErrorMessage =
            error.error?.message ??
            'This username already exists. Please choose another.';
        } else if (error.status === 400) {
          this.formErrorMessage =
            error.error?.message ??
            'Please check the information you entered.';
        } else {
          this.formErrorMessage =
            error.error?.message ??
            `Unable to create user. HTTP status: ${error.status}.`;
        }

        this.cdr.detectChanges();
      }
    });
  }

  // Open Edit User form
  openEditUserForm(user: User): void {
    this.showAddUserForm = false;

    this.editingUserId = user.id;

    this.editUser = {
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      divisionId: user.divisionId,
      isActive: user.isActive
    };

    this.formErrorMessage = '';
    this.successMessage = '';

    this.showEditUserForm = true;

    this.cdr.detectChanges();
  }

  // Close Edit User form
  closeEditUserForm(): void {
    if (this.isUpdatingUser) {
      return;
    }

    this.showEditUserForm = false;
    this.editingUserId = null;

    this.editUser = this.createEmptyEditUser();
    this.formErrorMessage = '';
  }

  // Update an existing user
  updateUser(): void {
    this.formErrorMessage = '';
    this.successMessage = '';

    if (this.editingUserId === null) {
      this.formErrorMessage =
        'No user has been selected for editing.';
      return;
    }

    const fullName = this.editUser.fullName.trim();
    const username = this.editUser.username.trim();

    if (!fullName || !username) {
      this.formErrorMessage =
        'Please enter the full name and username.';
      return;
    }

    if (
      this.editUser.role !== 'Admin' &&
      this.editUser.divisionId === null
    ) {
      this.formErrorMessage =
        'Please select a division for this user.';
      return;
    }

    const request: UpdateUserRequest = {
      ...this.editUser,
      fullName,
      username
    };

    this.isUpdatingUser = true;
    this.cdr.detectChanges();

    this.http
      .put(`/api/users/${this.editingUserId}`, request)
      .subscribe({
        next: () => {
          this.isUpdatingUser = false;
          this.showEditUserForm = false;
          this.editingUserId = null;

          this.editUser = this.createEmptyEditUser();

          this.successMessage = 'User updated successfully!';

          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Update user request failed:', error);

          this.isUpdatingUser = false;

          if (error.status === 0) {
            this.formErrorMessage =
              'Cannot connect to the server. Please check whether the backend is running.';
          } else if (error.status === 404) {
            this.formErrorMessage =
              error.error?.message ?? 'User not found.';
          } else if (error.status === 409) {
            this.formErrorMessage =
              error.error?.message ??
              'This username is already used by another account.';
          } else if (error.status === 400) {
            this.formErrorMessage =
              error.error?.message ??
              'Please check the information you entered.';
          } else {
            this.formErrorMessage =
              error.error?.message ??
              `Unable to update user. HTTP status: ${error.status}.`;
          }

          this.cdr.detectChanges();
        }
      });
  }

  // Available divisions in the user table
  get availableDivisions(): string[] {
    return [
      ...new Set(
        this.users
          .map(user => user.divisionName)
          .filter((name): name is string =>
            !!name && name !== 'Not Assigned'
          )
      )
    ].sort((a, b) => a.localeCompare(b));
  }

  // Filter users
  get filteredUsers(): User[] {
    const search = this.searchText.trim().toLowerCase();

    return this.users.filter(user => {
      const matchesSearch =
        !search ||
        (user.fullName ?? '').toLowerCase().includes(search) ||
        (user.username ?? '').toLowerCase().includes(search);

      const matchesRole =
        !this.selectedRole ||
        user.role.toLowerCase() === this.selectedRole.toLowerCase();

      const matchesDivision =
        !this.selectedDivision ||
        user.divisionName === this.selectedDivision;

      const matchesStatus =
        !this.selectedStatus ||
        (this.selectedStatus === 'active' && user.isActive) ||
        (this.selectedStatus === 'inactive' && !user.isActive);

      return (
        matchesSearch &&
        matchesRole &&
        matchesDivision &&
        matchesStatus
      );
    });
  }

  // Summary counts
  getTotalUsersCount(): number {
    return this.users.length;
  }

  getActiveUsersCount(): number {
    return this.users.filter(user => user.isActive).length;
  }

  getEmployeesCount(): number {
    return this.users.filter(
      user => user.role.toLowerCase() === 'employee'
    ).length;
  }

  getDivisionalHeadsCount(): number {
    return this.users.filter(user => {
      const role = user.role.toLowerCase();

      return (
        role === 'divisionalhead1' ||
        role === 'divisionalhead2'
      );
    }).length;
  }

  // Clear filters
  clearFilters(): void {
    this.searchText = '';
    this.selectedRole = '';
    this.selectedDivision = '';
    this.selectedStatus = '';
  }

  goToDashboard(): void {
    this.router.navigateByUrl('/admin');
  }

  logout(): void {
    localStorage.removeItem('user');
    this.router.navigateByUrl('/');
  }
}
