import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TrainListComponent } from './pages/TrainComponents/train-list/train-list.component';
import { SeatSelectionComponent } from './pages/TrainComponents/seat-selection/seat-selection.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { animation: 'Home' } },
  { path: 'trains', component: TrainListComponent, data: { animation: 'Trains' } },
  { path: 'seat-selection', component: SeatSelectionComponent, data: { animation: 'Seat' } },
  { path: 'login', component: LoginComponent, data: { animation: 'Login' } }
];