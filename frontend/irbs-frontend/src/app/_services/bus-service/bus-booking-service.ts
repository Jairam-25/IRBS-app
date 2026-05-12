import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BusBookingService {

  private baseUrl = 'https://localhost:7280/api';

  constructor(private http: HttpClient) {}

  // SEARCH BUSES
  searchBuses(
    from: string,
    to: string,
    date: string
  ): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.baseUrl}/Bus/search`,
      {
        params: {
          from,
          to,
          date
        }
      }
    );
  }

  // GET BOOKED SEATS
  getBookedSeats(
    busId: number,
    date: string,
    busName: string
  ): Observable<string[]> {

    return this.http.get<string[]>(
      `${this.baseUrl}/BusBooking/seats`,
      {
        params: {
          busId,
          date
        }
      }
    );
  }

  // BOOK SEATS
  bookSeats(data: any): Observable<any> {

    return this.http.post<any>(
      `${this.baseUrl}/BusBooking/book`,
      data
    );
  }

  // GET MY BOOKINGS
  getMyBookings(): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/BusBooking/mybookings`
    );
  }

  // CANCEL BOOKING
  cancelBooking(id: number): Observable<any> {

    return this.http.post<any>(
      `${this.baseUrl}/BusBooking/cancel?bookingId=${id}`,
      {}
    );
  }

  // GET BOOKING BY TRACKING NUMBER
  getBookingByTrackingNumber(
    trackingNumber: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.baseUrl}/BusBooking/booked/${trackingNumber}`
    );
  }

  // DOWNLOAD TICKET
  downloadTicket(
    bookingId: number
  ): Observable<Blob> {

    return this.http.get(
      `${this.baseUrl}/BusBooking/ticket/${bookingId}`,
      {
        responseType: 'blob'
      }
    );
  }
}