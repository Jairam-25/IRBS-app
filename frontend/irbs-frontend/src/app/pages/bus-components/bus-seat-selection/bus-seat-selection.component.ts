import { Component, OnInit, OnDestroy } from '@angular/core';
import { BusBookingService } from '../../../_services/bus-service/bus-booking-service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './bus-seat-selection.component.html',
  styleUrl: './bus-seat-selection.component.css'
})
export class BusSeatSelectionComponent implements OnInit, OnDestroy {
  busId!: number;
  travelDate!: string;
  busName!: string ;

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
    private service: BusBookingService
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

  getRows(): BusSeat[][] {
    const rows: BusSeat[][] = [];
    // First 10 rows: 4 seats each
    for (let i = 0; i < 40; i += 4) {
      rows.push(this.allSeats.slice(i, i + 4));
    }
    // Back row: 5 seats
    rows.push(this.allSeats.slice(40));
    return rows;
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
        alert('Max 6 seats only');
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
    if (this.bookedSeats.includes(seatId)) {
      return 'Booked now';
    }
    if (this.selectedSeats.includes(seatId)) {
      return 'Selected for you';
    }
    return 'Tap to reserve';
  }

  confirmBooking() {
    const payload = {
      busId: this.busId,
      busName: this.busName,
      userId: Number(localStorage.getItem('userId')),
      travelDate: this.travelDate,
      seatNumbers: this.selectedSeats
    };

    this.isBooking = true;

    this.service.bookSeats(payload).subscribe({
      next: () => {
        this.isBooking = false;
        alert('Booking successful');
        this.selectedSeats = [];
        this.loadBookedSeats();
      },
      error: err => {
        this.isBooking = false;
        alert(err?.error || 'Booking failed');
      }
    });
  }
}
