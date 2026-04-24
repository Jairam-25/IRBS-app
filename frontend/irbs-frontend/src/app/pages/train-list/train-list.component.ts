import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TrainService } from '../../_services/train.service';
import { StationService } from '../../_services/station.service';

// Angular Material imports (THIS WAS MISSING)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-train-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // 🔥 ADD THESE
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './train-list.component.html',
  styleUrls: ['./train-list.component.css']
})
export class TrainListComponent implements OnInit, OnDestroy {

  fromStation = '';
  toStation = '';
  selectedDate = '';

  trains: any[] = [];
  stations: any[] = [];

  filteredFromStations: any[] = [];
  filteredToStations: any[] = [];

  constructor(
    private trainService: TrainService,
    private stationService: StationService,
    private router: Router
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
    alert("Select valid stations");
    return;
  }

  if (this.fromStation === this.toStation) {
    alert("From and To cannot be same");
    return;
  }

  this.trainService.searchTrains(this.fromStation, this.toStation)
    .subscribe({
        next: (res: any) => {

          console.log("TRAIN API RESPONSE:", res);

          // 🔥 SAFE MAPPING (prevents UI breaking if fields missing)
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
        },

        error: (err: any) => {
          console.error(err);
          this.trains = []; // safe fallback
        }
      });
  }

  // =========================
  // SELECT TRAIN
  // =========================
  selectTrain(train: any) {

    if (!this.selectedDate) {
      alert('Select date first');
      return;
    }

    this.router.navigate(['/seat-selection'], {
      queryParams: {
        trainId: train.id,
        date: this.selectedDate
      }
    });
  }
}