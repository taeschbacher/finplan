import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() deletingBookingId: string | null = null;
  @Input() editingBookingId: string | null = null;
  @Input() actionsDisabled = false;
  @Input() emptyStateMessage =
    'No bookings yet. Add your first booking using the form.';
  @Output() editBookingRequested = new EventEmitter<Booking>();
  @Output() deleteBookingRequested = new EventEmitter<Booking>();

  trackByBookingId(_index: number, booking: Booking): string {
    return booking.id;
  }

  requestEdit(booking: Booking): void {
    if (this.actionsDisabled || this.editingBookingId === booking.id) {
      return;
    }

    this.editBookingRequested.emit(booking);
  }

  requestDelete(booking: Booking): void {
    if (this.actionsDisabled) {
      return;
    }

    this.deleteBookingRequested.emit(booking);
  }
}
