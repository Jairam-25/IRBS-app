import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TrainListComponent } from './pages/train-components/train-list/train-list.component';
import { SeatSelectionComponent } from './pages/train-components/seat-selection/seat-selection.component';
import { LoginComponent } from './pages/login/login.component';
import { BusBookingsComponent } from './pages/bus-components/bus-bookings/bus-bookings.component';
import { BusSearchComponent } from './pages/bus-components/bus-search/bus-search.component';
import { BusSeatSelectionComponent } from './pages/bus-components/bus-seat-selection/bus-seat-selection.component';
import { AuthGuard } from './interceptors/auth.guard'; 

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { animation: 'Home' } },
  { path: 'trains', component: TrainListComponent, data: { animation: 'Trains' } },
  { path: 'login', component: LoginComponent, data: { animation: 'Login' } },
  { path: 'bus-search', component: BusSearchComponent },
  { path: 'seat-selection', component: SeatSelectionComponent, canActivate: [AuthGuard], data: { animation: 'Seat' } },
  { path: 'seats/:busId', component: BusSeatSelectionComponent, canActivate: [AuthGuard] },
  { path: 'my-bookings', component: BusBookingsComponent, canActivate: [AuthGuard] }
];