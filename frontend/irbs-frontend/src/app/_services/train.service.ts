import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TrainService {

  // 🔥 GLOBAL BASE URL
  private baseUrl = 'https://localhost:7280/api';

  constructor(private http: HttpClient) {}

  getTrains(date: string) {
    return this.http.get(`${this.baseUrl}/Train?date=${date}`);
  }

  getBookedSeats(trainId: number, date: string) {
    return this.http.get(
      `${this.baseUrl}/Booking/seats?trainId=${trainId}&date=${date}`
    );
  }

  bookSeat(data: any) {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(
      `${this.baseUrl}/Booking/book`,
      data,
      { headers }
    );
  }
}