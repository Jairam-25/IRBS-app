import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrainService {

  private baseUrl = 'https://localhost:7280/api';

  constructor(private http: HttpClient) {}

  // ✅ GET ALL TRAINS
  getTrains(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Train`);
  }

  // ✅ SEARCH TRAINS (IMPORTANT)
  searchTrains(from: string, to: string): Observable<any> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    return this.http.get(`${this.baseUrl}/Train/search`, { params });
  }

  // ✅ GET BOOKED SEATS
  getBookedSeats(trainId: number, date: string): Observable<any> {
    const params = new HttpParams()
      .set('trainId', trainId)
      .set('date', date);

    return this.http.get(`${this.baseUrl}/Booking/seats`, { params });
  }

  // ✅ BOOK SEAT (CRITICAL FIX)
  bookSeat(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Booking/book`, data);
  }
}