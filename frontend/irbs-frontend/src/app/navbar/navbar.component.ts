import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../_services/auth.service';
import { Router } from 'express';
import { MatDialog } from '@angular/material/dialog';
import { PnrStatusComponent } from '../pages/pnr-status/pnr-status.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

  constructor(public auth: AuthService, private dialog: MatDialog) {}

  isNavigating = false;
  isMenuOpen = false;
  isScrolled = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    close();
  }

  logout() {
    this.auth.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  openPnrModal() {
    this.dialog.open(PnrStatusComponent, {
      width: '500px',
      panelClass: 'pnr-modal-container'
    });
  }
}