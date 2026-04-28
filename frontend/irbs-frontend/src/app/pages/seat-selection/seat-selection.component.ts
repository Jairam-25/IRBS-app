import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrainService } from '../../_services/train.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../_notifyAlert/popup.component';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit {

  seats: string[] = [];
  bookedSeats: string[] = [];

  // MULTI SELECT
  selectedSeats: string[] = [];
  maxSeats = 6;

  trainId!: number;
  date!: string;

  isBooking = false;

  userName = '';
  fromStation = '';
  toStation = '';

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

      this.trainId = +params['trainId'];
      this.date = new Date(params['date']).toISOString().split('T')[0];

      this.fromStation = params['from'];
      this.toStation = params['to'];

      this.generateSeats();
      this.loadBookedSeats();
    });
  }

  // =========================
  // GENERATE SEATS
  // =========================
  generateSeats() {
    const rows = ['A','B','C','D'];
    this.seats = [];

    for (let r of rows) {
      for (let i = 1; i <= 6; i++) {
        this.seats.push(r + i);
      }
    }
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

  // =========================
  // BOOK MULTIPLE
  // =========================
  bookSeat() {

    if (!this.selectedSeats.length) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: {
          title: 'Select Seat',
          message: 'Select at least one seat!'
        }
      });
      return;
    }

    this.isBooking = true;

    const body = {
      trainId: this.trainId,
      seatNumbers: this.selectedSeats,
      travelDate: this.date
    };

    const startTime = Date.now();

    this.trainService.bookMultipleSeats(body).subscribe({

      next: () => {

        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 1500 - elapsed);

        setTimeout(() => {

          this.isBooking = false;

          // instant UI update
          this.bookedSeats.push(...this.selectedSeats);

          this.dialog.open(PopupComponent, {
            width: '360px',
            panelClass: 'custom-dialog',
            data: {
              title: 'Booking Successful',
              message: `${this.selectedSeats.length} seats booked successfully`
            }
          });

          this.selectedSeats = [];

          // sync with backend
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