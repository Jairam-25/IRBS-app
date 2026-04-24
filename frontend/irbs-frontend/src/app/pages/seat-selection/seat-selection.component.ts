import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrainService } from '../../_services/train.service';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit {

  seats: string[] = [];
  bookedSeats: string[] = [];
  selectedSeat: string | null = null;

  trainId!: number;
  date!: string;

  constructor(
    private route: ActivatedRoute,
    private trainService: TrainService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.trainId = +params['trainId'];
      this.date = params['date'];

      console.log('TrainId:', this.trainId);
      console.log('Date:', this.date);

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
    alert('Select a seat first');
    return;
  }

  const userId = Number(localStorage.getItem('userId')); // YOU MUST STORE THIS AT LOGIN

  const body = {
    trainId: this.trainId,
    seatNumber: this.selectedSeat,
    travelDate: new Date(this.date).toISOString()
  };

  console.log('Booking payload:', body); // DEBUG

  this.trainService.bookSeat(body)
    .subscribe({
      next: (res: any) => {
        alert('Seat booked successfully');
        this.loadBookedSeats();
      },
      error: (err) => {
        console.error(err);
        alert(JSON.stringify(err.error?.errors)); // SHOW REAL ERROR
      }
    });
}
}