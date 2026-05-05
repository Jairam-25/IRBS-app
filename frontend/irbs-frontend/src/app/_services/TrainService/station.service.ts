import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StationService {

  private apiUrl = 'https://localhost:7280/api/station';

  constructor(private http: HttpClient) {}

  getStations() {
    return this.http.get<any[]>(this.apiUrl);
  }
}