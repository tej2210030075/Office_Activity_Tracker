import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  standalone: false
})
export class Login {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private apiUrl = '/api/Auth/login';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(): void {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';

    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Please enter your username and password.';
      return;
    }

    this.isLoading = true;

    this.http.post<any>(this.apiUrl, {
      username: this.username.trim(),
      password: this.password
    }).subscribe({
      next: (response) => {
        if (!response?.user) {
          this.errorMessage = 'Invalid response received from the server.';
          this.isLoading = false;
          return;
        }

        const user = response.user;
        localStorage.setItem('user', JSON.stringify(user));

        console.log('Login successful. User:', user);

        let destination = '';

        switch (user.role) {
          case 'Admin':
            destination = '/admin';
            break;

          case 'DivisionalHead1':
          case 'DivisionalHead2':
            destination = '/head-dashboard';
            break;

          case 'Employee':
            destination = '/employee-dashboard';
            break;

          default:
            this.errorMessage = 'Unrecognized user role.';
            localStorage.removeItem('user');
            this.isLoading = false;
            return;
        }

        this.router.navigateByUrl(destination).then((success) => {
          console.log('Navigation successful:', success);
          console.log('Current URL:', this.router.url);

          if (!success) {
            this.errorMessage =
              `Login succeeded, but navigation to ${destination} failed.`;
          }

          this.isLoading = false;
        }).catch((error) => {
          console.error('Navigation error:', error);
          this.errorMessage = 'Login succeeded, but the dashboard could not be opened.';
          this.isLoading = false;
        });
      },

      error: (error) => {
        console.error('Login API error:', error);

        this.errorMessage =
          error.error?.message ||
          'Login failed. Please check your username and password.';

        this.isLoading = false;
      }
    });
  }
}
