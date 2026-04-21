import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-selection.component.html',
  styleUrls: ['./seat-selection.component.css']
})
export class SeatSelectionComponent implements OnInit {

  seats: string[] = [];
  bookedSeats: string[] = [];
  selectedSeat: string = '';

  trainId!: number;
  date!: string;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.trainId = params['trainId'];
      this.date = params['date'];

      this.generateSeats();
      this.loadBookedSeats();

      // 🔄 Auto refresh
      setInterval(() => {
        this.loadBookedSeats();
      }, 5000);
    });
  }

  // 🎟️ Generate seats
  generateSeats() {
    this.seats = [];
    const rows = ['A', 'B', 'C', 'D'];

    for (let r of rows) {
      for (let i = 1; i <= 6; i++) {
        this.seats.push(r + i);
      }
    }
  }

  // 🔍 Get booked seats
  loadBookedSeats() {
    this.http.get<string[]>(
      `http://localhost:5041/api/booking/seats?trainId=${this.trainId}&date=${this.date}`
    ).subscribe(res => {
      this.bookedSeats = res;
    });
  }

  // 🎨 Select seat
  selectSeat(seat: string) {
    if (this.bookedSeats.includes(seat)) return;
    this.selectedSeat = seat;
  }

  // 🎟️ Book seat
  bookSeat() {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const body = {
      trainId: this.trainId,
      seatNumber: this.selectedSeat,
      travelDate: this.date
    };

    this.http.post('http://localhost:5041/api/booking/book', body, { headers })
      .subscribe({
        next: () => {
          alert('Seat booked successfully!');
          this.selectedSeat = '';
          this.loadBookedSeats();
        },
        error: err => {
          alert(err.error);
        }
      });
  }

  // 🎨 Seat color
  getSeatClass(seat: string) {
    if (this.bookedSeats.includes(seat)) return 'booked';
    if (this.selectedSeat === seat) return 'selected';
    return 'available';
  }
}