import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TrainService } from '../../_services/train.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../_notifyAlert/popup.component';
import { AuthService } from '../../_services/auth.service';
 
@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit {
 
  seats: string[] = [];
  bookedSeats: string[] = [];
 
  // Active coach seats for display
  coachSeats: string[] = [];
 
  // MULTI SELECT
  selectedSeats: string[] = [];
  maxSeats = 6;
 
  trainId!: number;
  trainNumber = '';       // ← NEW: backend uses TrainNumber (string)
  date!: string;
 
  isBooking = false;
 
  userName = '';
  fromStation = '';
  toStation = '';
 
  // ─── COACH TABS ───────────────────────────────────────────
  // Must match backend BookingService.GenerateAllSeats()
  coaches = [
    { name: 'S1', total: 72 },
    { name: 'S2', total: 72 },
    { name: 'A1', total: 64 }
  ];
  activeCoach = 'S1';
 
  // ─── PASSENGER FORM ───────────────────────────────────────
  showPassengerForm = false;
  passengers: { name: string; age: number | null }[] = [];
 
  constructor(
    private route: ActivatedRoute,
    private trainService: TrainService,
    private dialog: MatDialog,
    private auth: AuthService
  ) {}
 
  ngOnInit() {
 
    // USER
    this.auth.userName$.subscribe(name => {
      this.userName = name || 'Guest';
    });
 
    // PARAMS
    this.route.queryParams.subscribe(params => {
 
      this.trainId     = +params['trainId'];
      this.trainNumber = params['trainNumber'] || '';   // ← NEW
      this.date        = new Date(params['date']).toISOString().split('T')[0];
      this.fromStation = params['from'];
      this.toStation   = params['to'];
 
      this.generateSeats();
      this.loadBookedSeats();
    });
  }

  getBerth(seat: string): string {
    const num = parseInt(seat.split('-')[1], 10);

    const map = ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'];

    return map[(num - 1) % 8];
  }

  getSeatGroups(): string[][] {
    const groups: string[][] = [];

    for (let i = 0; i < this.coachSeats.length; i += 8) {
      groups.push(this.coachSeats.slice(i, i + 8));
    }

    return groups;
  }
 
  // =========================
  // GENERATE SEATS
  // Matches backend: S1-1…S1-72 | S2-1…S2-72 | A1-1…A1-64
  // =========================
  generateSeats() {
    this.seats = [];
 
    for (const c of this.coaches) {
      for (let i = 1; i <= c.total; i++) {
        this.seats.push(`${c.name}-${i}`);
      }
    }
 
    this.filterCoachSeats();
  }
 
  // Filter seats for the active coach tab
  filterCoachSeats() {
    this.coachSeats = this.seats.filter(s => s.startsWith(this.activeCoach + '-'));
  }
 
  // Switch active coach
  selectCoach(coach: string) {
    this.activeCoach = coach;
    this.filterCoachSeats();
  }
 
  // =========================
  // LOAD BOOKED
  // =========================
  loadBookedSeats() {
    this.trainService.getBookedSeats(this.trainId, this.date)
      .subscribe({
        next: (res: any) => {
          this.bookedSeats = res || [];
        },
        error: (err: any) => console.error('Seat load error', err)
      });
  }
 
  // =========================
  // SELECT (MULTI)
  // =========================
  selectSeat(seat: string) {
 
    if (this.bookedSeats.includes(seat) || this.isBooking) return;
 
    const index = this.selectedSeats.indexOf(seat);
 
    if (index > -1) {
      // ❌ unselect
      this.selectedSeats.splice(index, 1);
    } else {
 
      // 🚫 limit
      if (this.selectedSeats.length >= this.maxSeats) {
        this.dialog.open(PopupComponent, {
          width: '320px',
          data: {
            title: 'Limit reached',
            message: `Max ${this.maxSeats} seats allowed`
          }
        });
        return;
      }
 
      // ✅ add
      this.selectedSeats.push(seat);
    }
  }
 
  // =========================
  // UI CLASS
  // =========================
  getSeatClass(seat: string) {
    if (this.bookedSeats.includes(seat)) return 'booked';
    if (this.selectedSeats.includes(seat)) return 'selected';
    return 'available';
  }
 
  // ─── PASSENGER FORM ───────────────────────────────────────
 
  // Step 1: open passenger detail form
  openPassengerForm() {
 
    if (!this.selectedSeats.length) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: { title: 'Select Seat', message: 'Select at least one seat!' }
      });
      return;
    }
 
    // Init one passenger entry per selected seat
    this.passengers = this.selectedSeats.map(() => ({ name: '', age: null }));
    this.showPassengerForm = true;
  }
 
  // Close form without booking
  closePassengerForm() {
    this.showPassengerForm = false;
  }
 
  // Step 2: validate & proceed to book
  confirmPassengers() {
 
    const invalid = this.passengers.some(
      p => !p.name.trim() || !p.age || p.age <= 0
    );
 
    if (invalid) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: {
          title: 'Missing Info',
          message: 'Please fill name and age for all passengers.'
        }
      });
      return;
    }
 
    this.showPassengerForm = false;
    this.bookSeat();
  }
 
  // =========================
  // BOOK MULTIPLE
  // =========================
  bookSeat() {
 
    if (!this.selectedSeats.length) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: { title: 'Select Seat', message: 'Select at least one seat!' }
      });
      return;
    }
 
    this.isBooking = true;
 
    // ← Updated payload to match backend BookingDTO
    const body = {
      trainNumber: this.trainNumber,       // ← was trainId
      seatNumbers: this.selectedSeats,     // format: "S1-23"
      travelDate: this.date,
      passengers: this.passengers          // ← NEW: [{name, age}]
    };
 
    const startTime = Date.now();
 
    this.trainService.bookMultipleSeats(body).subscribe({
 
      next: (blob: Blob) => {
 
        const elapsed = Date.now() - startTime;
        const delay   = Math.max(0, 1500 - elapsed);
 
        // ─── Auto-download the PDF ticket ───────────────────
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `Ticket_${this.trainNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
 
        setTimeout(() => {
 
          this.isBooking = false;
 
          // Instant UI update
          this.bookedSeats.push(...this.selectedSeats);
 
          this.dialog.open(PopupComponent, {
            width: '360px',
            panelClass: 'custom-dialog',
            data: {
              title: 'Booking Successful',
              message: `${this.selectedSeats.length} seat(s) booked! Ticket downloaded.`
            }
          });
 
          this.selectedSeats = [];
          this.passengers    = [];
 
          // Sync with backend
          this.loadBookedSeats();
 
        }, delay);
 
        console.log('FINAL PAYLOAD:', body);
      },
 
      error: (err) => {
        console.log('FULL ERROR:', err);
        console.log('BACKEND MESSAGE:', err.error);
 
        this.isBooking = false;
 
        this.dialog.open(PopupComponent, {
          width: '360px',
          panelClass: 'custom-dialog',
          data: {
            title: 'Booking Failed',
            message: err.error?.message || JSON.stringify(err.error)
          }
        });
 
        console.log('FINAL PAYLOAD:', body);
      }
 
    });
  }
}