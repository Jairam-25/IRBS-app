import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusSeatSelectionComponent } from './bus-seat-selection.component';

describe('BusSeatSelectionComponent', () => {
  let component: BusSeatSelectionComponent;
  let fixture: ComponentFixture<BusSeatSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusSeatSelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BusSeatSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
