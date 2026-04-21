import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrainService } from '../../_services/train.service';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-selection.component.html',
  styleUrls: ['./seat-selection.component.css']
})
export class SeatSelectionComponent implements OnInit, OnDestroy {

  seats: string[] = [];
  bookedSeats: string[] = [];

  selectedSeats: string[] = [];

  trainId!: number;
  date!: string;

  private intervalId: any;

  constructor(
    private route: ActivatedRoute,
    private trainService: TrainService
  ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.trainId = +params['trainId'];
      this.date = params['date'];

      this.generateSeats();
      this.loadBookedSeats();

      // refresh booked seats safely
      this.intervalId = setInterval(() => {
        this.loadBookedSeats();
      }, 5000);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  // 🚆 Seat layout
  generateSeats() {
    this.seats = [];
    const rows = ['A', 'B', 'C', 'D'];

    for (let r of rows) {
      for (let i = 1; i <= 6; i++) {
        this.seats.push(r + i);
      }
    }
  }

  // 🔄 API call
  loadBookedSeats() {
    this.trainService.getBookedSeats(this.trainId, this.date)
      .subscribe({
        next: (res: any) => {
          this.bookedSeats = res || [];
        },
        error: (err) => console.error('Booked seats error', err)
      });
  }

  // 🎯 MULTI SELECT (IMPORTANT FIX)
  selectSeat(seat: string) {

    if (this.bookedSeats.includes(seat)) return;

    if (this.selectedSeats.includes(seat)) {
      this.selectedSeats = this.selectedSeats.filter(s => s !== seat);
    } else {
      this.selectedSeats = [...this.selectedSeats, seat];
    }
  }

  // 🎟️ BOOK MULTIPLE SEATS
  bookSeat() {

    if (this.selectedSeats.length === 0) {
      alert('Select at least one seat');
      return;
    }

    const body = {
      trainId: this.trainId,
      seatNumbers: this.selectedSeats,
      travelDate: this.date
    };

    this.trainService.bookSeat(body)
      .subscribe({
        next: (res: any) => {
          alert(res?.message || 'Booked successfully 🚆');
          this.selectedSeats = [];
          this.loadBookedSeats();
        },
        error: (err) => {
          alert(err.error?.message || err.error);
        }
      });
  }

  // 🎨 UI STATE
  getSeatClass(seat: string) {

    if (this.bookedSeats.includes(seat)) return 'booked';

    if (this.selectedSeats.includes(seat)) return 'selected';

    return 'available';
  }
}