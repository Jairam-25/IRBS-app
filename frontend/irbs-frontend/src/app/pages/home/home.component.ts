import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainService } from '../../_services/train.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  trains: any[] = [];

  selectedDate: string = '';
  selectedTrain: any = null;

  seats: string[] = [];
  selectedSeat: string | null = null;
  bookedSeats: string[] = [];

  constructor(private trainService: TrainService) {}

  ngOnInit() {
    this.generateSeats(); // 🔥 always generate seats
  }

  // 🔍 Load trains after date selected
  onDateChange() {
    if (!this.selectedDate) return;

    this.trainService.getTrains().subscribe({
      next: (res: any) => {
        this.trains = res;
      },
      error: (err: any) => console.error('Train load failed', err)
    });
  }

  // 🚆 Select train
  selectTrain(train: any) {
    this.selectedTrain = train;
    this.selectedSeat = null;
    this.loadBookedSeats();
  }

  // 🔄 Load booked seats
  loadBookedSeats() {
    if (!this.selectedTrain || !this.selectedDate) return;

    this.trainService.getBookedSeats(
      this.selectedTrain.id,
      this.selectedDate
    ).subscribe({
      next: (res: any) => {
        this.bookedSeats = res || [];
      },
      error: (err) => console.error(err)
    });
  }

  // 🎟️ Generate seats (STATIC)
  generateSeats() {
    const rows = ['A', 'B', 'C', 'D'];
    this.seats = [];

    for (let r of rows) {
      for (let i = 1; i <= 6; i++) {
        this.seats.push(r + i);
      }
    }
  }

  // 🎯 Select seat
  selectSeat(seat: string) {
    if (this.bookedSeats.includes(seat)) return;
    this.selectedSeat = seat;
  }

  // 🎨 Seat UI
  getSeatClass(seat: string) {
    if (this.bookedSeats.includes(seat)) return 'booked';
    if (this.selectedSeat === seat) return 'selected';
    return 'available'; // 🔥 MUST
  }

  // 🎟️ Book seat
  bookSeat() {

  if (!this.selectedSeat) {
    alert('Select a seat');
    return;
  }

  const body = {
    trainId: this.selectedTrain.id,
    seatNumber: this.selectedSeat,
    travelDate: new Date(this.selectedDate).toISOString() 
  };

  console.log('Booking payload:', body); // 🔍 debug

  this.trainService.bookSeat(body).subscribe({
    next: (res: any) => {
      alert(res.message || 'Booked successfully');
      this.selectedSeat = null;
      this.loadBookedSeats();
    },
    error: (err: any) => {
      console.error(err);
      alert(err.error?.message || 'Booking failed');
    }
  });
}
}