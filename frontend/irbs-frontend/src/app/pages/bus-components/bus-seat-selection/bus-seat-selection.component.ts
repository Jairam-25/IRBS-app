import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BusBookingService } from '../../../_services/bus-service/bus-booking-service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../../_notifyAlert/popup.component';

interface BusSeat {
  id: string;
  state: 'available' | 'ladies' | 'booked';
  section: string;
  row: number;
  position: string;
}

@Component({
  selector: 'app-bus-seat-selection',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, MatDialogModule],
  templateUrl: './bus-seat-selection.component.html',
  styleUrl: './bus-seat-selection.component.css'
})
export class BusSeatSelectionComponent implements OnInit, OnDestroy {
  busId!: number;
  travelDate!: string;
  busName!: string;

  allSeats: BusSeat[] = [];
  bookedSeats: string[] = [];
  selectedSeats: string[] = [];
  busNumber!: string; // Added

  // Array to store passenger details for each selected seat
  passengers: { 
    name: string; 
    age: number; 
    seatNumber: string; 
    berth: string;
    invalidName?: boolean;
    invalidAge?: boolean;
  }[] = [];

  maxSeats = 6;
  isBooking = false;
  lastRefresh = new Date();
  isRefreshing = false;
  private refreshTimer: any;

  // Passenger Form State
  showPassengerForm = false;

  sleeperUpperSeats: BusSeat[] = [];
  sleeperLowerSeats: BusSeat[] = [];

  leftSeats: BusSeat[] = [];
  rightSeats: BusSeat[][] = [];

  constructor(
    private route: ActivatedRoute,
    private service: BusBookingService,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {

    this.busId =
      Number(this.route.snapshot.paramMap.get('busId'));

    this.busName =
      this.route.snapshot.queryParamMap.get('busName')!;

    this.busNumber =
      this.route.snapshot.queryParamMap.get('busNumber')!;

    this.travelDate =
      this.route.snapshot.queryParamMap.get('date')!;

    this.generateSeats();
    this.loadBookedSeats();
    this.startLiveRefresh();
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  generateSeats() {

    this.allSeats = [];

    let seatNumber = 1;

  /* =========================
     LEFT SINGLE SEATS
  ========================= */

    for (let i = 0; i < 11; i++) {

      const seat: BusSeat = {
        id: `${seatNumber++}`,
        state: 'available',
        section: 'Lower',
        row: i + 1,
        position: 'L'
      };

      this.leftSeats.push(seat);
      this.allSeats.push(seat);
    }

  /* =========================
     RIGHT DOUBLE SEATS
  ========================= */

    for (let i = 0; i < 11; i++) {

      const rowSeats: BusSeat[] = [];

      for (let j = 0; j < 2; j++) {

        let state: 'available' | 'ladies' = 'available';

        if (j === 1 && i % 2 === 0) {
          state = 'ladies';
        }

        const seat: BusSeat = {
          id: `${seatNumber++}`,
          state,
          section: 'Lower',
          row: i + 1,
          position: 'R'
        };

        rowSeats.push(seat);
        this.allSeats.push(seat);
      }

      this.rightSeats.push(rowSeats);
    }

  /* =========================
     UPPER SLEEPER
  ========================= */

    for (let i = 0; i < 5; i++) {

      const seat: BusSeat = {
        id: `${seatNumber++}`,
        state: 'available',
        section: 'Upper Sleeper',
        row: 0,
        position: 'SU'
      };

      this.sleeperUpperSeats.push(seat);
      this.allSeats.push(seat);
    }

  /* =========================
     LOWER SLEEPER
  ========================= */

    for (let i = 0; i < 5; i++) {

      const seat: BusSeat = {
        id: `${seatNumber++}`,
        state: 'available',
        section: 'Lower Sleeper',
        row: 0,
        position: 'SL'
      };

      this.sleeperLowerSeats.push(seat);
      this.allSeats.push(seat);
    }
  }

  loadBookedSeats() {
    this.isRefreshing = true;

    this.service.getBookedSeats(this.busId, this.travelDate, this.busName)
      .subscribe({
        next: res => {
          this.bookedSeats = res || [];
          this.lastRefresh = new Date();
          this.isRefreshing = false;
        },
        error: () => {
          this.isRefreshing = false;
        }
      });
  }

  startLiveRefresh() {
    this.refreshTimer = setInterval(() => {
      this.loadBookedSeats();
    }, 9000);
  }

  selectSeat(seatId: string) {
    if (this.bookedSeats.includes(seatId)) return;

    const index = this.selectedSeats.indexOf(seatId);

    if (index > -1) {
      this.selectedSeats.splice(index, 1);
      this.removePassenger(seatId); // added
    } else {

      if (this.selectedSeats.length >= this.maxSeats) {
        this.dialog.open(PopupComponent, {
          width: '360px',
          data: {
            title: 'Limit Reached',
            message: `Maximum ${this.maxSeats} seats only select பண்ணலாம்!`
          }
        });
        return;
      }

      this.selectedSeats.push(seatId);
      
      // Get seat details to determine berth
      const seat = this.allSeats.find(s => s.id === seatId);
      
      // Add a passenger placeholder for this seat
      this.passengers.push({
        name: '', 
        age: 0, 
        seatNumber: seatId,
        berth: seat?.section || 'Lower',
        invalidName: false,
        invalidAge: false
      });

    }
  }

  // Helper to remove passenger when seat is unselected
  removePassenger(seatId: string) {
    const index = this.passengers.findIndex(p => p.seatNumber === seatId);
    if (index > -1) {
      this.passengers.splice(index, 1);
    }
  }

  getSeatClass(seatId: string) {
    if (this.bookedSeats.includes(seatId)) return 'booked';
    if (this.selectedSeats.includes(seatId)) return 'selected';
    const seat = this.allSeats.find(s => s.id === seatId);
    if (seat && seat.state === 'ladies') return 'ladies';
    return 'available';
  }

  getSeatType(seatId: string) {
    const seat = this.allSeats.find(item => item.id === seatId);
    return seat ? `${seat.position} • ${seat.section}` : '';
  }

  getSeatSubtitle(seatId: string) {
    if (this.bookedSeats.includes(seatId)) 
      return 'Booked now';
    if (this.selectedSeats.includes(seatId)) 
      return 'Selected for you';
    return 'Tap to reserve';
  }

  // PASSENGER FORM CONTROLS
  openPassengerForm() {
    this.showPassengerForm = true;
  }

  closePassengerForm() {
    this.showPassengerForm = false;
  }

  confirmBooking() {
    // Basic validation
    let hasError = false;
    this.passengers.forEach(p => {
      if (!p.name || p.name.trim().length < 3) {
        p.invalidName = true;
        hasError = true;
      }
      if (!p.age || p.age <= 0) {
        p.invalidAge = true;
        hasError = true;
      }
    });


    if (hasError) return;

    this.finalizeBooking();
  }

  finalizeBooking() {
    let userId = 0;
    if (isPlatformBrowser(this.platformId)) {
      const storedUserId = localStorage.getItem('userId');
      userId = storedUserId ? Number(storedUserId) : 0;
    }

    if (!userId) {
      this.dialog.open(PopupComponent, {
        width: '360px',
        data: {
          title: 'Session Expired',
          message: 'Please login again to book seats.'
        }
      });
      return;
    }

    // Ensure busNumber is not the string "null" or "undefined"
    let finalBusNumber = this.busNumber;
    if (finalBusNumber === 'null' || finalBusNumber === 'undefined' || !finalBusNumber) {
        finalBusNumber = this.busName || 'BUS-GENERIC'; 
    }

    // Use PascalCase for the backend DTO
    const finalPassengers = this.passengers.map((p) => ({
      Name: p.name,
      Age: p.age,
      SeatNumber: p.seatNumber,
      Berth: p.berth
    }));

    const payload = {
      BusNumber: finalBusNumber,
      TravelDate: new Date(this.travelDate).toISOString(),
      Passengers: finalPassengers
    };

    console.log('Final Bus Booking Payload (book-multiple):', JSON.stringify(payload, null, 2));

    this.isBooking = true;

    this.service.bookSeats(payload).subscribe({
      next: (blob: Blob) => {
        this.isBooking = false;
        this.selectedSeats = [];
        this.passengers = []; 
        this.showPassengerForm = false; // Close modal
        this.loadBookedSeats();

        // Download the PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IRBS_Bus_Ticket_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);

        this.dialog.open(PopupComponent, {
          width: '360px',
          data: {
            title: 'Booking Successful! 🎉',
            message: 'Your seats successfully booked! Ticket downloaded.'
          }
        });
      },

      error: (err: any) => {
        this.isBooking = false;
        console.error('Booking error detail:', err);

        // Handle Blob error response from server (since responseType is blob)
        if (err.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.error('Server error message:', result);
            try {
              const errorObj = JSON.parse(result);
              this.showErrorPopup(errorObj.message || errorObj || 'Booking failed');
            } catch (e) {
              this.showErrorPopup(result || 'Booking failed');
            }
          };
          reader.readAsText(err.error);
        } else {
          const msg = err.error?.message || err.error || 'Booking failed. Please try again.';
          this.showErrorPopup(msg);
        }
      }
    });
  }

  private showErrorPopup(message: string) {
    this.dialog.open(PopupComponent, {
      width: '360px',
      data: {
        title: 'Booking Failed ❌',
        message: message
      }
    });
  }
}

