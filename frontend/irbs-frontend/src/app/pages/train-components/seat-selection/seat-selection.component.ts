import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TrainService } from '../../../_services/train-service/train.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../../_notifyAlert/popup.component';
import { AuthService } from '../../../_services/auth-service/auth.service';
import { ViewChildren, QueryList, ElementRef } from '@angular/core';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit {

  @ViewChildren('nameInput') nameInputs!: QueryList<ElementRef>;
  @ViewChildren('ageInput')  ageInputs!: QueryList<ElementRef>;

  seats: string[] = [];
  bookedSeats: string[] = [];

   // Active coach seats for display
  coachSeats: string[] = [];

   // MULTI SELECT
  selectedSeats: string[] = [];
  maxSeats = 6;

  trainId!: number;
  trainNumber = '';
  date!: string;

  isBooking = false;

  userName = '';
  fromStation = '';
  toStation = '';

  activeCoach = 'S1';

  invalidForm = false;

  secondaryCoach = '';
  primaryCoachSeats: string[] = [];
  secondaryCoachSeats: string[] = [];


  showPassengerForm = false;
  passengers: {
    name: string;
    age: number | null;
    berth?: string;
    invalidName?: boolean;
    invalidAge?: boolean;
  }[] = [];

  coaches: { name: string; total: number }[] = [];

  constructor(
    private route: ActivatedRoute,
    private trainService: TrainService,
    private dialog: MatDialog,
    private auth: AuthService
  ) {}

  ngOnInit() {

    // USER
    this.auth.userName$.subscribe(name => {
      this.userName = name || 'Guest';
    });

    // PARAMS
    this.route.queryParams.subscribe(params => {

      this.trainId     = +params['trainId'];
      this.trainNumber = params['trainNumber'] || '';
      this.date        = new Date(params['date']).toISOString().split('T')[0];
      this.fromStation = params['from'];
      this.toStation   = params['to'];

      if (!this.trainNumber) {
        this.dialog.open(PopupComponent, {
          width: '360px',
          data: {
            title: 'Critical Error',
            message: 'Train number missing. Please reselect train.'
          }
        });

        return;
      }

      this.generateSeats();
      this.loadBookedSeats();
    });

  }

  getSeatType(seat: string): string {
    const num = parseInt(seat.split('-')[1], 10);
    const pos = (num - 1) % 4;
    const map = ['Lower', 'Middle', 'Upper', 'Side'];
    return map[pos];
  }

  getSeatRows(): string[][] {
    const rows: string[][] = [];

    for (let i = 0; i < this.coachSeats.length; i += 8) {
      rows.push(this.coachSeats.slice(i, i + 8));
    }

    return rows;
  }

  getSeatBlocks(): string[][][] {
    const rows = this.getSeatRows();
    const blocks: string[][][] = [];

    for (let i = 0; i < rows.length; i += 2) {
      blocks.push(rows.slice(i, i + 2));
    }

    return blocks;
  }

  getSeatBlocksForCoach(coachSeats: string[]): string[][][] {
    const rows: string[][] = [];
    for (let i = 0; i < coachSeats.length; i += 4) {
      rows.push(coachSeats.slice(i, i + 4));
    }
    const blocks: string[][][] = [];
    for (let i = 0; i < rows.length; i += 2) {
      blocks.push(rows.slice(i, i + 2));
    }
    return blocks;
  }

  generateSeats() {
    this.seats = [];
    this.coaches = [];

    const config = [
      { prefix: 'S', count: 10, seats: 72 },
      { prefix: 'A', count: 5, seats: 64 },
      { prefix: 'B', count: 3, seats: 64 }
    ];

    for (const type of config) {
      for (let c = 1; c <= type.count; c++) {
        const coachName = `${type.prefix}${c}`;
        this.coaches.push({
           name: coachName, 
           total: type.seats
           });

        for (let i = 1; i <= type.seats; i++) {
          this.seats.push(`${coachName}-${i}`);
        }
      }
    }

    this.activeCoach = this.coaches[0].name;
    this.filterCoachSeats();
  }

    // Filter seats for the active coach tab
  filterCoachSeats() {
    const idx = this.coaches.findIndex(c => c.name === this.activeCoach);

    this.primaryCoachSeats = this.seats.filter(s =>
      s.startsWith(this.activeCoach + '-')
    );

    if (idx + 1 < this.coaches.length) {
      this.secondaryCoach = this.coaches[idx + 1].name;
      this.secondaryCoachSeats = this.seats.filter(s =>
        s.startsWith(this.secondaryCoach + '-')
      );
    } else {
      this.secondaryCoach = '';
      this.secondaryCoachSeats = [];
    }

      // keep coachSeats in sync (used by getSeatRows/getSeatBlocks if called elsewhere)
    this.coachSeats = this.primaryCoachSeats;
  }

    // Switch active coach
  selectCoach(coach: string) {
    this.activeCoach = coach;
    this.filterCoachSeats();
  }

    // =========================
  // LOAD BOOKED
  // =========================
  loadBookedSeats() {
    this.trainService.getBookedSeats(this.trainId, this.date)
      .subscribe({
        next: (res: any) => {
          this.bookedSeats = res || [];
        },
        error: () => {}
      });
  }

  // =========================
  // SELECT (MULTI)
  // =========================
  selectSeat(seat: string) {

    if (this.bookedSeats.includes(seat) || this.isBooking) return;

    const index = this.selectedSeats.indexOf(seat);

    if (index > -1) {

      this.selectedSeats.splice(index, 1);
    } else {

      // limit
      if (this.selectedSeats.length >= this.maxSeats) {
        this.dialog.open(PopupComponent, {
          width: '320px',
          data: {
            title: 'Limit reached',
            message: `Max ${this.maxSeats} seats allowed`
          }
        });
        return;
      }

      // add
      this.selectedSeats.push(seat);
    }
  }
  
  // =========================
  // UI CLASS
  // =========================
  getSeatClass(seat: string) {
    if (this.bookedSeats.includes(seat))  return 'booked';
    if (this.selectedSeats.includes(seat)) return 'selected';
    return 'available';
  }

  openPassengerForm() {
    if (!this.selectedSeats.length) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: { title: 'Select Seat', message: 'Select at least one seat!' }
      });
      return;
    }
    this.passengers = this.selectedSeats.map(() => ({ name: '', age: null }));
    this.showPassengerForm = true;
  }

  closePassengerForm() {
    this.showPassengerForm = false;
  }

  confirmPassengers() {
    let hasError = false;

    this.passengers.forEach(p => {
      p.invalidName = false;
      p.invalidAge  = false;
    });

    setTimeout(() => {
      this.passengers.forEach(p => {
        p.invalidName = !p.name || !p.name.trim();
        p.invalidAge  = !p.age || p.age <= 0;
        if (p.invalidName || p.invalidAge) hasError = true;
      });

      if (hasError) {
        this.focusFirstInvalid();
        return;
      }

      this.showPassengerForm = false;
      this.bookSeat();
    });
  }

  focusFirstInvalid() {
    for (let i = 0; i < this.passengers.length; i++) {
      const p = this.passengers[i];
      if (p.invalidName) {
        this.nameInputs.toArray()[i]?.nativeElement.focus();
        return;
      }
      if (p.invalidAge) {
        this.ageInputs.toArray()[i]?.nativeElement.focus();
        return;
      }
    }
  }

  bookSeat() {
    if (!this.selectedSeats.length) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: { title: 'Select Seat', message: 'Select at least one seat!' }
      });
      return;
    }

    this.isBooking = true;

    const body = {
      trainNumber: this.trainNumber,
      seatNumbers: this.selectedSeats,
      travelDate: this.date,
      passengers: this.selectedSeats.map((seat, i) => ({
        name:  this.passengers[i].name,
        age:   this.passengers[i].age,
        berth: this.getSeatType(seat)
      }))
    };

    const startTime = Date.now();

    this.trainService.bookMultipleSeats(body).subscribe({
      next: (blob: Blob) => {
        const elapsed = Date.now() - startTime;
        const delay   = Math.max(0, 1500 - elapsed);

        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `Ticket_${this.trainNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          this.isBooking = false;
          this.bookedSeats.push(...this.selectedSeats);

          this.dialog.open(PopupComponent, {
            width: '360px',
            panelClass: 'custom-dialog',
            data: {
              title: 'Booking Successful',
              message: `${this.selectedSeats.length} seat(s) booked successfully! Ticket downloaded.`
            }
          });

          this.selectedSeats = [];
          this.passengers    = [];
          this.loadBookedSeats();
        }, delay);
      },
      error: (err) => {
        this.isBooking = false;

        if (err.status === 401) {
          this.dialog.open(PopupComponent, {
            width: '360px',
            panelClass: 'custom-dialog',
            data: { title: 'Booking Failed', message: 'Please login and try again.' }
          });
        } else if (err.status === 404) {
          this.dialog.open(PopupComponent, {
            width: '360px',
            panelClass: 'custom-dialog',
            data: { title: 'Booking Failed', message: 'Seats not available. Please reselect.' }
          });
        } else if (err.status === 500) {
          this.dialog.open(PopupComponent, {
            width: '360px',
            panelClass: 'custom-dialog',
            data: { title: 'Booking Failed', message: 'Server error. Try again later.' }
          });
        } else {
          this.dialog.open(PopupComponent, {
            width: '360px',
            panelClass: 'custom-dialog',
            data: { title: 'Booking Failed', message: 'Something went wrong.' }
          });
        }
      }
    });
  }
}