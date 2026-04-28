import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrainService } from '../../_services/train.service';
import { StationService } from '../../_services/station.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../_notifyAlert/popup.component';

// Angular Material imports (THIS WAS MISSING)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-train-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // ADD THESE
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,

    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './train-list.component.html',
  styleUrls: ['./train-list.component.css']
})
export class TrainListComponent implements OnInit, OnDestroy {

  fromStation = '';
  toStation = '';
  // selectedDate = '';
  isLoading = false;
  hasSearched = false;

  trains: any[] = [];
  stations: any[] = [];

  filteredFromStations: any[] = [];
  filteredToStations: any[] = [];

    // FIXED: Only ONE type
    selectedDate!: Date;
    // block past dates
    minDate: Date = new Date();

  constructor(
    private trainService: TrainService,
    private stationService: StationService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  // =========================
  // INIT
  // =========================
  ngOnInit() {
    this.trains = [];
    this.loadStations();
  }

  loadStations() {
  this.stationService.getStations().subscribe({
    next: (res) => {
      this.stations = res;
      this.filteredFromStations = res;
      this.filteredToStations = res;
    }
  });
}

filterFrom(value: string) {
  this.filteredFromStations = this._filter(value);
}

filterTo(value: string) {
  this.filteredToStations = this._filter(value);
}

private _filter(value: string) {
  const filterValue = value.toLowerCase();
  return this.stations.filter(s =>
    s.name.toLowerCase().includes(filterValue)
  );
}

swapStations() {
  const temp = this.fromStation;
  this.fromStation = this.toStation;
  this.toStation = temp;
}

  // =========================
  // CLEANUP
  // =========================
  ngOnDestroy() {
    this.trains = [];
  }

  // =========================
  // SEARCH TRAINS
  // =========================
  searchTrains() {

  if (!this.fromStation || !this.toStation) {
    this.dialog.open(PopupComponent, {
      width: '360px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog',
      data: {
        title: 'Select Station',
        message: 'Select valid stations!'
      },
      disableClose: true
    });
    return;
  }

  if (this.fromStation === this.toStation) {
    this.dialog.open(PopupComponent, {
      width: '360px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog',
      data: {
        title: 'Select Station',
        message: 'From station and To station cannot be same!'
      },
      disableClose: true
    });
    return;
  }
  
    this.isLoading = true;
    this.trains = []; // clear old results immediately

    const startTime = Date.now();

  this.trainService.searchTrains(this.fromStation, this.toStation)
    .subscribe({
        next: (res: any) => {

          console.log("TRAIN API RESPONSE:", res);
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(3000 - elapsed, 0);

          // SAFE MAPPING (prevents UI breaking if fields missing)
          setTimeout(() => {
          this.trains = (res || []).map((t: any) => ({
            id: t.id,
            trainName: t.trainName,
            fromStation: t.fromStation || 'N/A',
            toStation: t.toStation || 'N/A',            

            // optional fields (safe fallback)
            date: t.date || '',
            departureTime: t.departureTime || '',
            arrivalTime: t.arrivalTime || '',

            availableSeats: t.availableSeats ?? 0,
            bookedSeats: t.bookedSeats ?? 0,
            totalSeats: t.totalSeats ?? 0
          }));
          this.isLoading = false;
          this.hasSearched = true;
          }, remaining);        
        },

        error: (err: any) => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(3000 - elapsed, 0);

          setTimeout(() => {
          this.trains = [];
          this.isLoading = false;
          this.hasSearched = false;
        }, remaining);
      }
      });
  }

  // =========================
  // SELECT TRAIN
  // =========================
  selectTrain(train: any) {

    if (!this.selectedDate) {
      this.dialog.open(PopupComponent, {
      width: '360px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog',
      data: {
        title: 'Select date',
        message: 'Select date first!'
      },
      disableClose: true
    });
      return;
    }

    this.router.navigate(['/seat-selection'], {
      queryParams: {
        trainId: train.id,
        date: this.selectedDate,
        from: train.fromStation,
        to: train.toStation
      }
    });
  }
}