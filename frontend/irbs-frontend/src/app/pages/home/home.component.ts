import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainService } from '../../_services/train.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
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
    this.generateSeats();
  }

  // 🔥 CALL WHEN DATE CHANGES
  onDateChange() {
    if (!this.selectedDate) return;

    this.trainService.getTrains(this.selectedDate).subscribe({
      next: (res: any) => {
        this.trains = res;
      },
      error: (err) => console.error('Train load failed', err)
    });
  }

  selectTrain(train: any) {
    this.selectedTrain = train;
    this.selectedSeat = null;
    this.loadBookedSeats();
  }

  loadBookedSeats() {
    if (!this.selectedTrain || !this.selectedDate) return;

    this.trainService.getBookedSeats(
      this.selectedTrain.id,
      this.selectedDate
    ).subscribe({
      next: (res: any) => {
        this.bookedSeats = res;
      },
      error: (err) => console.error(err)
    });
  }

  generateSeats() {
    const rows = ['A', 'B', 'C', 'D'];
    this.seats = [];

    for (let r of rows) {
      for (let i = 1; i <= 6; i++) {
        this.seats.push(r + i);
      }
    }
  }

  selectSeat(seat: string) {
    if (this.bookedSeats.includes(seat)) return;
    this.selectedSeat = seat;
  }

  getSeatClass(seat: string) {
    if (this.bookedSeats.includes(seat)) return 'booked';
    if (this.selectedSeat === seat) return 'selected';
    return '';
  }

  bookSeat() {
    const body = {
      trainId: this.selectedTrain.id,
      seatNumber: this.selectedSeat,
      travelDate: this.selectedDate
    };

    this.trainService.bookSeat(body).subscribe({
      next: () => {
        alert('Booked!');
        this.loadBookedSeats();
      },
      error: err => console.error(err)
    });
  }
}