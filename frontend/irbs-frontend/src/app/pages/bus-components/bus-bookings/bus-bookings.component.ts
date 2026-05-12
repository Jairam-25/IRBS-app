import { Component } from '@angular/core';
import { BusBookingService } from '../../../_services/bus-service/bus-booking-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bus-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bus-bookings.component.html',
  styleUrl: './bus-bookings.component.css'
})
export class BusBookingsComponent {
  bookings: any[] = [];

  constructor(private service: BusBookingService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getMyBookings()
      .subscribe(res => this.bookings = res as any[]);
  }

  cancel(id: number) {
    this.service.cancelBooking(id).subscribe(() => {
      alert('Cancelled');
      this.load();
    });
  }
}
