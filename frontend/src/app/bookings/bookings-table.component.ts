import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Booking } from './booking.model';

@Component({
  selector: 'app-bookings-table',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './bookings-table.component.html',
  styleUrls: ['./bookings-table.component.css'],
})
export class BookingsTableComponent {
  @Input({ required: true }) bookings: Booking[] = [];
  @Input() loading = false;

  trackByBookingId(_index: number, booking: Booking): string {
    return booking.id;
  }
}
