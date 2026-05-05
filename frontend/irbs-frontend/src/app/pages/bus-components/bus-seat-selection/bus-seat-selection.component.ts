import { Component } from '@angular/core';
import { BusBookingService } from '../../../_services/bus-service/bus-booking-service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bus-seat-selection',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './bus-seat-selection.component.html',
  styleUrl: './bus-seat-selection.component.css'
})
export class BusSeatSelectionComponent {
  busId!: number;
  travelDate!: string;

  allSeats: string[] = [];
  bookedSeats: string[] = [];
  selectedSeats: string[] = [];

  maxSeats = 6;

  constructor(
    private route: ActivatedRoute,
    private service: BusBookingService
  ) {}

  ngOnInit() {
    this.busId = Number(this.route.snapshot.paramMap.get('busId'));
    this.travelDate = this.route.snapshot.queryParamMap.get('date')!;

    this.generateSeats(40);
    this.loadBookedSeats();
  }

  generateSeats(total: number) {
    this.allSeats = [];
    for (let i = 1; i <= total; i++) {
      this.allSeats.push('S' + i);
    }
  }

  loadBookedSeats() {
    this.service.getBookedSeats(this.busId, this.travelDate)
      .subscribe(res => this.bookedSeats = res);
  }

  selectSeat(seat: string) {

    if (this.bookedSeats.includes(seat)) return;

    const index = this.selectedSeats.indexOf(seat);

    if (index > -1) {
      this.selectedSeats.splice(index, 1);
    } else {

      if (this.selectedSeats.length >= this.maxSeats) {
        alert('Max 6 seats only');
        return;
      }

      this.selectedSeats.push(seat);
    }
  }

  getSeatClass(seat: string) {
    if (this.bookedSeats.includes(seat)) return 'booked';
    if (this.selectedSeats.includes(seat)) return 'selected';
    return 'available';
  }

  confirmBooking() {

    const payload = {
      busId: this.busId,
      userId: Number(localStorage.getItem('userId')),
      travelDate: this.travelDate,
      seatNumbers: this.selectedSeats
    };
    

    this.service.bookSeats(payload).subscribe({
      next: () => {
        alert('Booking successful');
        this.selectedSeats = [];
        this.loadBookedSeats();
      },
      error: err => alert(err.error)
    });
  }
}
