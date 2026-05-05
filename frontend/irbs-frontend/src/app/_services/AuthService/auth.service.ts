import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://localhost:7280/api/Auth';

  // =========================
  // STATE (safe defaults)
  // =========================
  private userNameSubject = new BehaviorSubject<string>('');
  userName$ = this.userNameSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
  if (this.isBrowser()) {
    const token = this.hasToken();
    const name = this.getStoredUserName();

    this.isLoggedInSubject.next(token);
    this.userNameSubject.next(name);
  }
}

  // =========================
  // API CALLS
  // =========================
  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  getToken(): string | null {
        if (this.isBrowser()) {
      return localStorage.getItem('token');
    }
    return null;
  }
  // =========================
  // SESSION MANAGEMENT
  // =========================
  setSession(res: any) {
  if (!this.isBrowser()) return;

  const token = res.token;
  localStorage.setItem('token', token);

  const decoded: any = jwtDecode(token);

  // ✅ correct claim extraction
  const name =
    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
    decoded.name ||
    'User';

  const email =
    decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    '';

  // fallback logic (clean)
  const finalName = name || email.split('@')[0] || 'User';

  localStorage.setItem('userName', finalName);

  this.userNameSubject.next(finalName);
  this.isLoggedInSubject.next(true);
}

  logout() {
    if (!this.isBrowser()) return;

    localStorage.removeItem('token');
    localStorage.removeItem('userName');

    this.userNameSubject.next('');
    this.isLoggedInSubject.next(false);
  }

  // =========================
  // HELPERS (SSR SAFE)
  // =========================
  private getStoredUserName(): string {
    if (!this.isBrowser()) return '';
    return localStorage.getItem('userName') || '';
  }

  private hasToken(): boolean {
    if (!this.isBrowser()) return false;
    return !!localStorage.getItem('token');
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}