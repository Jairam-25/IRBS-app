import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { BusBookingService }
from '../../../_services/bus-service/bus-booking-service';

@Component({
  selector: 'app-bus-tracking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './bus-tracking.component.html',
  styleUrls: ['./bus-tracking.component.css']
})
export class BusTrackingComponent {

  trackingNumber = '';

  loading = false;

  error = '';

  data: any = null;

  constructor(
    private busService: BusBookingService,
    private dialogRef: MatDialogRef<BusTrackingComponent>
  ) {}

  // SEARCH BOOKING
  searchBooking() {

    if (!this.trackingNumber) {

      this.error = 'Enter tracking number';

      return;
    }

    this.loading = true;

    this.error = '';

    this.data = null;

    this.busService
      .getBookingByTrackingNumber(this.trackingNumber)
      .subscribe({

        next: (res) => {

          this.data = res;

          this.loading = false;
        },

        error: (err) => {

          this.loading = false;

          if (err.status === 401) {

            this.error =
              'Please login to continue';
          }
          else if (err.status === 404) {

            this.error =
              'Booking not found';
          }
          else if (err.status === 500) {

            this.error =
              'Server error';
          }
          else {

            this.error =
              'Something went wrong';
          }
        }
      });
  }

  // DOWNLOAD TICKET
  downloadTicket() {

    if (!this.data?.passengers?.length) {

      this.error = 'Ticket not available';

      return;
    }

    const bookingId =
      this.data.passengers[0].id;

    this.busService
      .downloadTicket(bookingId)
      .subscribe({

        next: (blob: Blob) => {

          const url =
            window.URL.createObjectURL(blob);

          const a =
            document.createElement('a');

          a.href = url;

          a.download =
            `Bus_Ticket_${this.trackingNumber}.pdf`;

          a.click();

          window.URL.revokeObjectURL(url);
        },

        error: () => {

          this.error =
            'Unable to download ticket';
        }
      });
  }

  // CLOSE MODAL
  close() {

    this.dialogRef.close();
  }
}