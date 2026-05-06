import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class BusBookingService {

  private baseUrl = 'https://localhost:7280/api';

  constructor(private http: HttpClient) {}

searchBuses(from: string, to: string, date: string) {
  return this.http.get<any[]>(
    `${this.baseUrl}/Bus/search`,
    {
      params: {
        from: from,
        to: to,
        date: date
      }
    }
  );
}

  getBookedSeats(busId: number, date: string) {
  return this.http.get<string[]>(
    `${this.baseUrl}/BusBooking/seats`,
    {
      params: {
        busId: busId,
        date: date
      }
    }
  );
}

  bookSeats(data: any) {
    return this.http.post(`${this.baseUrl}/BusBooking/book`, data);
  }

  getMyBookings() {
    return this.http.get(`${this.baseUrl}/BusBooking/mybookings`);
  }

  cancelBooking(id: number) {
    return this.http.post(`${this.baseUrl}/BusBooking/cancel?bookingId=${id}`, {});
  }
}