import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { TrainListComponent } from './pages/train-list/train-list.component';
import { SeatSelectionComponent } from './pages/seat-selection/seat-selection.component';

export const routes: Routes = [
    { path: '', component: LoginComponent},
    { path: 'home', component: HomeComponent},
    { path: 'trains', component: TrainListComponent},
    { path: 'seats', component: SeatSelectionComponent}
];

