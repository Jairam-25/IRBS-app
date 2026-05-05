import { Component } from '@angular/core';
import { BusBookingService } from '../../../_services/bus-service/bus-booking-service';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bus-search',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './bus-search.component.html',
  styleUrl: './bus-search.component.css'
})
export class BusSearchComponent {
from = '';
  to = '';
  buses: any[] = [];

  constructor(private service: BusBookingService,
              private router: Router) {}

  search() {
    if (!this.from || !this.to) {
      alert('Enter from and to');
      return;
    }

    this.service.searchBuses(this.from, this.to)
      .subscribe(res => this.buses = res);
  }

  selectBus(bus: any) {
    this.router.navigate(['/seats', bus.id], {
      queryParams: { date: bus.travelDate }
    });
  }
}
