import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
 
@Injectable({
  providedIn: 'root'
})
export class TrainService {
 
  private baseUrl = 'https://localhost:7280/api';
 
  constructor(private http: HttpClient) {}
 
  // GET ALL TRAINS
  getTrains(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Train`);
  }
 
  // SEARCH TRAINS (FIXED WITH DATE)
  searchTrains(from: string, to: string, date: string): Observable<any> {
 
    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('date', date);
 
    return this.http.get(`${this.baseUrl}/Train/search`, { params });
  }
 
  // GET BOOKED SEATS (FIXED URL + ENCODE DATE)
  getBookedSeats(trainId: number, date: string): Observable<any> {
 
    const params = new HttpParams()
      .set('trainId', trainId)
      .set('date', new Date(date).toISOString());
 
    return this.http.get(`${this.baseUrl}/Booking/seats`, { params });
  }
 
  // BOOK SEAT
  bookSeat(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Booking/book`, data);
  }
 
  // BOOK MULTIPLE — responseType: 'blob' because backend returns PDF file
  bookMultipleSeats(data: any): Observable<Blob> {
    return this.http.post(
      `${this.baseUrl}/Booking/book-multiple`,
      data,
      { responseType: 'blob' }   // ← backend returns File(pdfBytes, "application/pdf")
    );
  }
}