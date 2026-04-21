import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../_services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private auth: AuthService, private router: Router) {}

  email = '';
  password = '';

  onLogin() {
  const data = {
    email: this.email,
    password: this.password
  };

  this.auth.login(data).subscribe({
    next: (res) => {
      console.log('Login success', res);

      localStorage.setItem('token', res.token);

      this.router.navigate(['/home']);
    },
      error: (err) => {
        console.error('Login failed', err);
        alert('Invalid credentials');
      }
    });
  }
}
