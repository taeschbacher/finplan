import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking, CreateBookingRequest } from './booking.model';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/bookings';

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.baseUrl);
  }

  createBooking(payload: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.baseUrl, payload);
  }

  deleteBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
