import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-train-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './train-list.component.html',
  styleUrls: ['./train-list.component.css']
})
export class TrainListComponent implements OnInit {

  trains: any[] = [];
  selectedDate: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadTrains();
  }

  // 🚆 Load trains
  loadTrains() {
    this.http.get<any[]>('http://localhost:5041/api/train')
      .subscribe(res => {
        this.trains = res;
      });
  }

  // 👉 Select train
  selectTrain(trainId: number) {
    if (!this.selectedDate) {
      alert('Please select a date');
      return;
    }

    this.router.navigate(['/seat-selection'], {
      queryParams: {
        trainId: trainId,
        date: this.selectedDate
      }
    });
  }
}