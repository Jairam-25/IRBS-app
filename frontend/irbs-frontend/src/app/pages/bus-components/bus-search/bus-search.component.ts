import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { PopupComponent } from '../../../_notifyAlert/popup.component';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatDialog } from '@angular/material/dialog';

import { MatNativeDateModule } from '@angular/material/core';
import { BusBookingService } from '../../../_services/bus-service/bus-booking-service';

import { BusInterface } from '../../../_interface/bus-interface';

@Component({
  selector: 'app-bus-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatNativeDateModule
  ],
  templateUrl: './bus-search.component.html',
  styleUrls: ['./bus-search.component.css']
})
export class BusSearchComponent implements OnInit {

  // 🔹 Inputs
  fromCity: string = '';
  toCity: string = '';
  travelDate: Date | null = null;

  // 🔹 City master data
  cities: any[] = [];
  filteredFromCities: any[] = [];
  filteredToCities: any[] = [];

  // 🔹 Bus data
  buses: BusInterface[] = [];

  // 🔹 UI
  isLoading = false;
  hasSearched = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog,
    private service: BusBookingService,
  ) {}

  ngOnInit(): void {
    this.loadCities();
  }

  // Load cities from API
  loadCities() {
    this.http.get<any[]>('https://localhost:7280/api/city')
      .subscribe({
        next: (res) => {
          this.cities = res || [];
          this.filteredFromCities = this.cities;
          this.filteredToCities = this.cities;
        },
        error: (err) => {
          console.error('City load failed', err);
        }
      });
  }

  // 🔍 Filter FROM
  filterFrom(value: string) {
    const val = value?.toLowerCase() || '';

    this.filteredFromCities = this.cities.filter(c =>
      c.city.toLowerCase().startsWith(val)
    );
  }

  // 🔍 Filter TO
  filterTo(value: string) {
    const val = value.toLowerCase();

    this.filteredToCities = this.cities.filter(c =>
      c.city.toLowerCase().includes(val)
    );
  }

  // Swap cities
  swapCities() {    
    const temp = this.fromCity;
    this.fromCity = this.toCity;
    this.toCity = temp;
  }

  // Search buses
searchBuses() {

  if (!this.fromCity || !this.toCity || !this.travelDate) {
    this.dialog.open(PopupComponent, {
      width: '360px',
      panelClass: 'custom-dialog',
      data: {
        title: 'Selection Incomplete',
        message: 'Please fill in all fields to search buses.'
      }
    });
    return;
  }

  const formattedDate = this.travelDate.toISOString().split('T')[0];

  this.isLoading = true;
  this.hasSearched = true;

  this.service.searchBuses(this.fromCity, this.toCity, formattedDate)
    .subscribe({
      next: (res) => {        
        this.buses = res || [];
        this.buses.forEach(bus => {
          this.loadSeats(bus);
        });
        this.isLoading = false;
      },
      
      error: (err) => {
              this.isLoading = false;
              this.hasSearched = false;
      
              // Handle based on status
              if (err.status === 401) {
                  this.dialog.open(PopupComponent, {
                  width: '360px',
                  panelClass: 'custom-dialog',
                  data: {
                    title: 'Searching Failed',
                    message: 'Please login and try again to search buses.'
                  }
                });
              }
              else if (err.status === 404) {
                this.dialog.open(PopupComponent, {
                width: '360px',
                panelClass: 'custom-dialog',
                data: {
                  title: 'Searching Failed',
                  message: 'No buses found for the selected route.'
                }
              });
              }
              else if (err.status === 500) {
                this.dialog.open(PopupComponent, {
                width: '360px',
                panelClass: 'custom-dialog',
                data: {
                  title: 'Searching Failed',
                  message: 'Server error. Try again later'
                }
              });
              }
              else {
                this.dialog.open(PopupComponent, {
                width: '360px',
                panelClass: 'custom-dialog',
                data: {
                  title: 'Searching Failed',
                  message: 'Something went wrong'
                }
              });
              };
            }
    });
}

loadSeats(bus: BusInterface) {
  this.service.getBookedSeats(bus.id, bus.travelDate)
    .subscribe((seats) => {
      bus.bookedSeats = seats.length;
    });
}

  // Select bus → go to seat page
  selectBus(bus: BusInterface) {
    this.router.navigate(['/seats', bus.id], {
      queryParams: { 
        date: new Date(bus.travelDate).toISOString()
      }
    });
  }
}
