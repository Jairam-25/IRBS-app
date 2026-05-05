import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TrainService } from '../../_services/train.service';

@Component({
  selector: 'app-pnr-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './pnr-status.component.html',
  styleUrls: ['./pnr-status.component.css']
})
export class PnrStatusComponent {

  pnrNumber = '';
  loading = false;
  error = '';
  data: any = null;

  constructor(
    private trainService: TrainService,
    private dialogRef: MatDialogRef<PnrStatusComponent>
  ) {}

  groupedSeats: { [coach: string]: string[] } = {};

  searchPNR() {

    if (!this.pnrNumber || this.pnrNumber.length < 6) {
      this.error = 'Enter valid PNR number';
      return;
    }

    this.loading = true;
    this.error = '';
    this.data = null;

    this.trainService.getBookingByPNR(this.pnrNumber)
      .subscribe({
        next: (res) => {
          this.data = res;
          this.groupSeats();
          this.loading = false;
        },
        error: (err) => {
        this.loading = false;

        // Handle based on status
        if (err.status === 401) {
          this.error = 'Please login and try again to view ticket.';
        }
        else if (err.status === 404) {
          this.error = 'PNR not found';
        }
        else if (err.status === 500) {
          this.error = 'Server error. Try again later';
        }
        else {
          this.error = 'Something went wrong';
        }
      }
      });
  }

  downloadTicket() {

    this.trainService.downloadTicketByPNR(this.pnrNumber)
      .subscribe((blob: Blob) => {

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `Ticket_${this.pnrNumber}.pdf`;
        a.click();

        window.URL.revokeObjectURL(url);
      });
  }

  close() {
    this.dialogRef.close();
  }

  getGroupedSeats(): Record<string, string[]> {
  if (!this.data?.seats) return {};

  return this.data.seats.reduce((acc: Record<string, string[]>, seat: string) => {
    const [coach, num] = seat.split('-');

    if (!acc[coach]) acc[coach] = [];
    acc[coach].push(num);

    return acc;
  }, {});
}

groupSeats() {
  this.groupedSeats = {};

  if (!this.data?.seats) return;

  this.data.seats.forEach((seat: string) => {
    const [coach, num] = seat.split('-');

    if (!this.groupedSeats[coach]) {
      this.groupedSeats[coach] = [];
    }

    this.groupedSeats[coach].push(num);
  });
}
}