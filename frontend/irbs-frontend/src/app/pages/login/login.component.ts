import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../_services/auth-service/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../_notifyAlert/popup.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, MatDialogModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  // =====================
  // FORM FIELDS
  // =====================
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  // =====================
  // UI STATE
  // =====================
  isLoading = false;
  isRegisterMode = false;

  // =====================
  // VALIDATION
  // =====================
  emailValid = false;
  passwordValid = false;
  passwordsMatch = false;
  emailExistsError = false;

  // =====================
  // TOGGLE
  // =====================
  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;

    // reset everything
    this.emailExistsError = false;
    this.password = '';
    this.confirmPassword = '';
  }

  // =====================
  // EMAIL CHECK
  // =====================
  checkEmail() {
    this.emailExistsError = false;

    this.emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  // =====================
  // PASSWORD RULES
  // =====================
  hasMinLength() { 
    return this.password.length >= 8;
   }

  hasUppercase() {
     return /[A-Z]/.test(this.password);
     }

  hasLowercase() {
     return /[a-z]/.test(this.password);
     }
     
  hasNumber() { 
    return /\d/.test(this.password);
   }
   
  hasSpecial()
     { 
      return /[@$!%*?&]/.test(this.password);
     }

  checkPassword() {
    this.passwordValid =
      this.hasMinLength() &&
      this.hasUppercase() &&
      this.hasLowercase() &&
      this.hasNumber() &&
      this.hasSpecial();
  }

  getStrength() {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUppercase()) score++;
    if (this.hasLowercase()) score++;
    if (this.hasNumber()) score++;
    if (this.hasSpecial()) score++;

    return (score / 5) * 100;
  }

  // =====================
  // CONFIRM PASSWORD
  // =====================
  checkMatch() {
    this.passwordsMatch = this.password === this.confirmPassword;
  }

  // =====================
  // SUBMIT
  // =====================
  onSubmit() {
    if (this.isRegisterMode) {
      this.register();
    } else {
      this.login();
    }
  }

    // =====================
  // LOGIN
  // =====================
  login() {
    this.isLoading = true;

    const data = {
      email: this.email,
      password: this.password
    };

    this.auth.login(data).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.isLoading = false;

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        const ref = this.dialog.open(PopupComponent, {
          width: '360px',
          maxWidth: '90vw',
          panelClass: 'custom-dialog',
          data: {
            title: 'Login Successful',
            message: 'You have been logged in successfully.'
          },
          disableClose: true
        });

        ref.afterClosed().subscribe(() => {
          this.router.navigate([returnUrl]);
        });
      },
      error: () => {
        this.isLoading = false;
        this.dialog.open(PopupComponent, {
          width: '360px',
          maxWidth: '90vw',
          panelClass: 'custom-dialog',
          data: {
            title: 'Invalid Credentials',
            message: 'Invalid email or password. Please try again.'
          },
          disableClose: true
        });
      }
    });
  }

  // =====================
  // REGISTER
  // =====================
  register() {

    if (!this.emailValid || !this.passwordValid || !this.passwordsMatch) {
      return;
    }

    this.isLoading = true;

    const data = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.auth.register(data).subscribe({
      next: () => {
        this.isLoading = false;

        const ref = this.dialog.open(PopupComponent, {
          width: '360px',
          maxWidth: '90vw',
          panelClass: 'custom-dialog',
          data: {
            title: 'Registration Successful',
            message: 'Your account has been created successfully.'
          },
          disableClose: true
        });

        ref.afterClosed().subscribe(() => {
          this.isRegisterMode = false;
          this.password = '';
          this.confirmPassword = '';
        });
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error === 'User already exists') {
          this.emailExistsError = true;
        }
      }
    });
  }
}