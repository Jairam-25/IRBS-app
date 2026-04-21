import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../_services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('pageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ]),
      transition(':leave', [
        animate('300ms ease-in',
          style({ opacity: 0, transform: 'translateY(-20px)' })
        )
      ])
    ])
  ]
})
export class LoginComponent {

  constructor(private auth: AuthService, private router: Router) {}

  email = '';
  password = '';
  isLoading = false;

  bubbles = Array(6);

//   onLogin() {
//   console.log("Login clicked"); // add this
// }

  onLogin() {
  const data = {
    email: this.email,
    password: this.password
  };

  this.auth.login(data).subscribe({
    next: (res) => {
      console.log('Login success', res);

      this.isLoading = true;

      // simulate API call OR replace with real API
      setTimeout(() => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      }, 1500);

      localStorage.setItem('token', res.token);
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 300);
      // this.router.navigate(['/home']);
    },
      error: (err) => {
        console.error('Login failed', err);
        alert('Invalid credentials');
      }
    });
  }
}
