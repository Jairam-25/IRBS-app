import { Component, OnInit, OnDestroy } from '@angular/core';
import { BusBookingService } from '../../../_services/bus-service/bus-booking-service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../../_notifyAlert/popup.component';

interface BusSeat {
  id: string;
  state: 'available' | 'ladies' | 'booked';
  section: string;
  row: number;
  position: string;
}

@Component({
  selector: 'app-bus-seat-selection',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatDialogModule],
  templateUrl: './bus-seat-selection.component.html',
  styleUrl: './bus-seat-selection.component.css'
})
export class BusSeatSelectionComponent implements OnInit, OnDestroy {
  busId!: number;
  travelDate!: string;
  busName!: string;

  allSeats: BusSeat[] = [];
  bookedSeats: string[] = [];
  selectedSeats: string[] = [];

  maxSeats = 6;
  isBooking = false;
  lastRefresh = new Date();
  isRefreshing = false;
  private refreshTimer: any;

  sleeperUpperSeats: BusSeat[] = [];
  sleeperLowerSeats: BusSeat[] = [];

  leftSeats: BusSeat[] = [];
  rightSeats: BusSeat[][] = [];

  constructor(
    private route: ActivatedRoute,
    private service: BusBookingService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {

    this.busId =
      Number(this.route.snapshot.paramMap.get('busId'));

    this.busName =
      this.route.snapshot.queryParamMap.get('busName')!;

    this.travelDate =
      this.route.snapshot.queryParamMap.get('date')!;

    this.generateSeats();
    this.loadBookedSeats();
    this.startLiveRefresh();
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  generateSeats() {

    this.allSeats = [];

    let seatNumber = 1;

  /* =========================
     LEFT SINGLE SEATS
  ========================= */

    for (let i = 0; i < 11; i++) {

      const seat: BusSeat = {
        id: `${seatNumber++}`,
        state: 'available',
        section: 'Lower',
        row: i + 1,
        position: 'L'
      };

      this.leftSeats.push(seat);
      this.allSeats.push(seat);
    }

  /* =========================
     RIGHT DOUBLE SEATS
  ========================= */

    for (let i = 0; i < 11; i++) {

      const rowSeats: BusSeat[] = [];

      for (let j = 0; j < 2; j++) {

        let state: 'available' | 'ladies' = 'available';

        if (j === 1 && i % 2 === 0) {
          state = 'ladies';
        }

        const seat: BusSeat = {
          id: `${seatNumber++}`,
          state,
          section: 'Lower',
          row: i + 1,
          position: 'R'
        };

        rowSeats.push(seat);
        this.allSeats.push(seat);
      }

      this.rightSeats.push(rowSeats);
    }

  /* =========================
     UPPER SLEEPER
  ========================= */

    for (let i = 0; i < 5; i++) {

      const seat: BusSeat = {
        id: `${seatNumber++}`,
        state: 'available',
        section: 'Upper Sleeper',
        row: 0,
        position: 'SU'
      };

      this.sleeperUpperSeats.push(seat);
      this.allSeats.push(seat);
    }

  /* =========================
     LOWER SLEEPER
  ========================= */

    for (let i = 0; i < 5; i++) {

      const seat: BusSeat = {
        id: `${seatNumber++}`,
        state: 'available',
        section: 'Lower Sleeper',
        row: 0,
        position: 'SL'
      };

      this.sleeperLowerSeats.push(seat);
      this.allSeats.push(seat);
    }
  }

  loadBookedSeats() {
    this.isRefreshing = true;

    this.service.getBookedSeats(this.busId, this.travelDate, this.busName)
      .subscribe({
        next: res => {
          this.bookedSeats = res || [];
          this.lastRefresh = new Date();
          this.isRefreshing = false;
        },
        error: () => {
          this.isRefreshing = false;
        }
      });
  }

  startLiveRefresh() {
    this.refreshTimer = setInterval(() => {
      this.loadBookedSeats();
    }, 9000);
  }

  selectSeat(seatId: string) {
    if (this.bookedSeats.includes(seatId)) return;

    const index = this.selectedSeats.indexOf(seatId);

    if (index > -1) {
      this.selectedSeats.splice(index, 1);
    } else {
      if (this.selectedSeats.length >= this.maxSeats) {
        this.dialog.open(PopupComponent, {
          width: '360px',
          data: {
            title: 'Limit Reached',
            message: `Maximum ${this.maxSeats} seats only select பண்ணலாம்!`
          }
        });
        return;
      }

      this.selectedSeats.push(seatId);
    }
  }

  getSeatClass(seatId: string) {
    if (this.bookedSeats.includes(seatId)) return 'booked';
    if (this.selectedSeats.includes(seatId)) return 'selected';
    const seat = this.allSeats.find(s => s.id === seatId);
    if (seat && seat.state === 'ladies') return 'ladies';
    return 'available';
  }

  getSeatType(seatId: string) {
    const seat = this.allSeats.find(item => item.id === seatId);
    return seat ? `${seat.position} • ${seat.section}` : '';
  }

  getSeatSubtitle(seatId: string) {
    if (this.bookedSeats.includes(seatId)) 
      return 'Booked now';
    if (this.selectedSeats.includes(seatId)) 
      return 'Selected for you';
    return 'Tap to reserve';
  }

  confirmBooking() {

    const userId = Number(localStorage.getItem('userId'));

    if (!userId) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: {
          title: 'Session Expired',
          message: 'Please login again to book seats.'
        }
      });
      return;
    }

    const payload = {
      busId: this.busId,
      busName: this.busName,
      userId: userId,
      travelDate: this.travelDate,
      seatNumbers: this.selectedSeats
    };

    this.isBooking = true;

    this.service.bookSeats(payload).subscribe({
      next: () => {
        this.isBooking = false;
        this.selectedSeats = [];
        this.loadBookedSeats();

        this.dialog.open(PopupComponent, {
          width: '360px',
          data: {
            title: 'Booking Successful! 🎉',
            message: 'Your seats successfully booked!'
          }
        });
      },
      error: err => {
        this.isBooking = false;

        if (err.status === 401) {
          this.dialog.open(PopupComponent, {
            width: '360px',
            data: {
              title: 'Login Required',
              message: 'Please login and try again.'
            }
          });
        } else if (err.status === 400) {
          this.dialog.open(PopupComponent, {
            width: '360px',
            data: {
              title: 'Booking Failed',
              message: err?.error || 'Seats already booked.'
            }
          });
        } else {
          this.dialog.open(PopupComponent, {
            width: '360px',
            data: {
              title: 'Booking Failed',
              message: 'Something went wrong. Try again.'
            }
          });
        }
      }
    });
  }
}
