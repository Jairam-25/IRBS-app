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
  selectedSeat: string | null = null;

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
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.auth.userName$.subscribe(name => {
    this.userName = name || 'Guest';
  });
    this.route.queryParams.subscribe(params => {
      this.trainId = +params['trainId'];
      this.date = params['date'];

      this.fromStation = params['from'];
      this.toStation = params['to'];

      console.log('TrainId:', this.trainId);
      console.log('Date:', this.date);
      console.log('From Station:', this.fromStation);
      console.log('To Station:', this.toStation);

      this.generateSeats();
      this.loadBookedSeats();
    });
  }

  // 🚆 Generate seats
  generateSeats() {
    const rows = ['A','B','C','D'];
    this.seats = [];

    for (let r of rows) {
      for (let i = 1; i <= 6; i++) {
        this.seats.push(r + i);
      }
    }
  }

  // 🔄 Load booked seats
  loadBookedSeats() {
    this.trainService.getBookedSeats(this.trainId, this.date)
      .subscribe({
        next: (res: any) => {
          this.bookedSeats = res || [];
        },
        error: (err: any) => console.error('Seat load error', err)
      });
  }

  // 🎯 Select seat
  selectSeat(seat: string) {
    if (this.bookedSeats.includes(seat)) return;
    this.selectedSeat = seat;
  }

  // 🎨 UI class
  getSeatClass(seat: string) {
    if (this.bookedSeats.includes(seat)) return 'booked';
    if (this.selectedSeat === seat) return 'selected';
    return 'available';
  }

  // 🎟️ Book seat
bookSeat() {

  if (!this.selectedSeat) {
    this.dialog.open(PopupComponent, {
      width: '360px',
      panelClass: 'custom-dialog',
      data: {
        title: 'Select Seat',
        message: 'Select a seat first!'
      },
      disableClose: true
    });
    return;
  }

  this.isBooking = true; // START LOADING

  const body = {
    trainId: this.trainId,
    seatNumber: this.selectedSeat,
    travelDate: new Date(this.date).toISOString()
  };

  const startTime = Date.now(); // for smooth delay

  this.trainService.bookSeat(body).subscribe({
    next: (res: any) => {

      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 1500 - elapsed); // minimum 1.5s feel

      setTimeout(() => {
        this.isBooking = false;

        this.dialog.open(PopupComponent, {
          width: '360px',
          panelClass: 'custom-dialog',
          data: {
            title: 'Success',
            message: 'Seat booked successfully.'
          },
          disableClose: true
        });

        this.selectedSeat = null;
        this.loadBookedSeats();

      }, delay);
    },

    error: (err) => {

      this.isBooking = false;

      this.dialog.open(PopupComponent, {
        width: '360px',
        panelClass: 'custom-dialog',
        data: {
          title: 'Booking Failed',
          message: err.error?.message || 'Something went wrong'
        },
        disableClose: true
      });
    }
  });
}
}