import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../_environments/environment';

@Injectable({ providedIn: 'root' })
export class StationService {

private apiUrl = `${environment.apiUrl}/station`;

  constructor(private http: HttpClient) {}

  getStations() {
    return this.http.get<any[]>(this.apiUrl);
  }
}