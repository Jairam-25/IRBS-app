import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { TrainListComponent } from './pages/train-list/train-list.component';
import { SeatSelectionComponent } from './pages/seat-selection/seat-selection.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'trains', component: TrainListComponent },
  { path: 'seat-selection', component: SeatSelectionComponent },
  { path: 'login', component: LoginComponent }
];