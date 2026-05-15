import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusBookingsComponent } from './bus-bookings.component';

describe('BusBookingsComponent', () => {
  let component: BusBookingsComponent;
  let fixture: ComponentFixture<BusBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusBookingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BusBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
