import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BusBookingsComponent } from './bus-bookings/bus-bookings.component';
import { BusSeatSelectionComponent } from './bus-seat-selection/bus-seat-selection.component';
import { BusSearchComponent } from './bus-search/bus-search.component';

const routes: Routes = [
  { path: '', component: BusSearchComponent },
  { path: 'seats/:busId', component: BusSeatSelectionComponent },
  { path: 'my-bookings', component: BusBookingsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BusComponentsRoutingModule {

}
