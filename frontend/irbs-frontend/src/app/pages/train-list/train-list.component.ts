import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TrainService } from '../../_services/train.service';
import { StationService } from '../../_services/station.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PopupComponent } from '../../_notifyAlert/popup.component';

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
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './train-list.component.html',
  styleUrls: ['./train-list.component.css']
})
export class TrainListComponent implements OnInit, OnDestroy {

  fromStation = '';
  toStation = '';
  selectedDate!: Date;

  isLoading = false;
  hasSearched = false;

  trains: any[] = [];
  stations: any[] = [];

  filteredFromStations: any[] = [];
  filteredToStations: any[] = [];

  minDate: Date = new Date();

  constructor(
    private trainService: TrainService,
    private stationService: StationService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

  // =========================
  // INIT
  // =========================
  ngOnInit() {
    this.loadStations();

    // 🔥 RESTORE STATE (BACK BUTTON / REFRESH)
    this.route.queryParams.subscribe(params => {

      if (params['from'] && params['to'] && params['date']) {

        this.fromStation = params['from'];
        this.toStation = params['to'];

        // convert string → Date
        this.selectedDate = new Date(params['date']);

        // 🔥 silent search (no URL update again)
        this.searchTrainsSilently();
      }
    });
  }

  // =========================
  // LOAD STATIONS
  // =========================
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
  // SEARCH (WITH URL UPDATE)
  // =========================
  searchTrains() {

    if (!this.fromStation || !this.toStation) {
      this.showPopup('Select Station', 'Select valid stations!');
      return;
    }

    if (this.fromStation === this.toStation) {
      this.showPopup('Select Station', 'From and To cannot be same!');
      return;
    }

    if (!this.selectedDate) {
      this.showPopup('Select Date', 'Please select travel date!');
      return;
    }

    this.isLoading = true;
    this.trains = [];

    // 🔥 PUSH TO URL (IMPORTANT)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        from: this.fromStation,
        to: this.toStation,
        date: this.selectedDate.toISOString()
      },
      queryParamsHandling: 'merge'
    });

    this.callTrainAPI();
  }

  // =========================
  // SILENT SEARCH (NO URL UPDATE)
  // =========================
  searchTrainsSilently() {
    this.isLoading = true;
    this.trains = [];
    this.callTrainAPI();
  }

  // =========================
  // COMMON API CALL
  // =========================
  callTrainAPI() {

    const startTime = Date.now();

    this.trainService.searchTrains(this.fromStation, this.toStation, this.selectedDate.toISOString())
      .subscribe({

        next: (res: any) => {

          const elapsed = Date.now() - startTime;
          const remaining = Math.max(1000 - elapsed, 0);

          setTimeout(() => {

            this.trains = (res || []).map((t: any) => ({
              id: t.id,
              trainNumber: t.trainNumber,   // ✅ ADD THIS (CRITICAL)
              trainName: t.trainName,
              fromStation: t.fromStation || 'N/A',
              toStation: t.toStation || 'N/A',
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

        error: () => {
          this.isLoading = false;
          this.trains = [];
        }
      });
  }

  // =========================
  // SELECT TRAIN
  // =========================
  selectTrain(train: any) {

    console.log('SELECTED TRAIN:', train);

    if (!this.selectedDate) {
      this.showPopup('Select date', 'Select date first!');
      return;
    }

    this.router.navigate(['/seat-selection'], {
      queryParams: {
        trainId:     train.id,
        trainNumber: train.trainNumber,
        date:        this.selectedDate,
        from:        train.fromStation,
        to:          train.toStation
      }
    });
  }

  // =========================
  // POPUP HELPER
  // =========================
  showPopup(title: string, message: string) {
    this.dialog.open(PopupComponent, {
      width: '360px',
      panelClass: 'custom-dialog',
      data: { title, message },
      disableClose: true
    });
  }
}