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
          this.loading = false;
        },
        error: () => {
          this.error = 'PNR not found';
          this.loading = false;
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
}