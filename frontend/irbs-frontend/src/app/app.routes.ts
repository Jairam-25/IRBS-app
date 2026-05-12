import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TrainListComponent } from './pages/train-components/train-list/train-list.component';
import { SeatSelectionComponent } from './pages/train-components/seat-selection/seat-selection.component';
import { LoginComponent } from './pages/login/login.component';
import { BusBookingsComponent } from './pages/bus-components/bus-bookings/bus-bookings.component';
import { BusSearchComponent } from './pages/bus-components/bus-search/bus-search.component';
import { BusSeatSelectionComponent } from './pages/bus-components/bus-seat-selection/bus-seat-selection.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { animation: 'Home' } },
  { path: 'trains', component: TrainListComponent, data: { animation: 'Trains' } },
  { path: 'seat-selection', component: SeatSelectionComponent, data: { animation: 'Seat' } },
  { path: 'login', component: LoginComponent, data: { animation: 'Login' } },
  { path: 'seats/:busId', component: BusSeatSelectionComponent },
  { path: 'bus-search', component: BusSearchComponent },
  { path: 'my-bookings', component: BusBookingsComponent }
];