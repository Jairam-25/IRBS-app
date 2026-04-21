import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('pageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ])
  ]
})
export class LoginComponent {

  constructor(private auth: AuthService, private router: Router) {}

  // form fields
  name = '';
  email = '';
  password = '';

  // states
  isLoading = false;
  isSuccess = false;
  isRegisterMode = false;

  bubbles = Array(6);

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
  }

  onSubmit() {
    if (this.isRegisterMode) {
      this.register();
    } else {
      this.login();
    }
  }

  // LOGIN
  login() {
    const data = {
      email: this.email,
      password: this.password
    };

    this.auth.login(data).subscribe({
      next: (res) => {
        console.log('Login success', res);

        this.isLoading = true;
        this.isSuccess = false;

        localStorage.setItem('token', res.token);

        setTimeout(() => {
          this.isLoading = false;
          this.isSuccess = true;

          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 800);

        }, 1200);
      },
      error: (err) => {
        console.error('Login failed', err);
        alert('Invalid credentials');
      }
    });
  }

  // REGISTER
  register() {
    const data = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.auth.register(data).subscribe({
      next: (res) => {
        console.log('Register success', res);

        alert('Registration successful 🚉 Please login');

        this.isRegisterMode = false;
        this.password = '';
      },
      error: (err) => {
        console.error('Register failed', err);
        alert('Registration failed');
      }
    });
  }
}