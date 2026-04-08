import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Booking, CreateBookingRequest } from './booking.model';
import { BookingFormComponent } from './booking-form.component';
import { BookingsTableComponent } from './bookings-table.component';
import { BookingsService } from './bookings.service';

@Component({
  selector: 'app-bookings-page',
  standalone: true,
  imports: [CommonModule, BookingFormComponent, BookingsTableComponent],
  templateUrl: './bookings-page.component.html',
  styleUrls: ['./bookings-page.component.css'],
})
export class BookingsPageComponent implements OnInit {
  @ViewChild(BookingFormComponent) bookingForm?: BookingFormComponent;

  private readonly destroyRef = inject(DestroyRef);
  private readonly bookingsService = inject(BookingsService);

  readonly bookings = signal<Booking[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingBookingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  ngOnInit(): void {
    this.loadBookings();
  }

  onCreateBooking(payload: CreateBookingRequest): void {
    this.saving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.bookingsService
      .createBooking(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Booking saved successfully.');
          this.bookingForm?.reset();
          this.loadBookings({ showLoadingIndicator: false });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractErrorMessage(error, 'Unable to save booking.'),
          );
        },
      });
  }

  onDeleteBooking(booking: Booking): void {
    if (this.deletingBookingId() !== null) {
      return;
    }

    const confirmed = globalThis.confirm(
      `Delete the booking "${booking.text}" from ${booking.bookingDate}?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingBookingId.set(booking.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.bookingsService
      .deleteBooking(booking.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deletingBookingId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Booking deleted successfully.');
          this.loadBookings({ showLoadingIndicator: false });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractErrorMessage(error, 'Unable to delete booking.'),
          );
        },
      });
  }

  private loadBookings(options: { showLoadingIndicator?: boolean } = {}): void {
    const showLoadingIndicator = options.showLoadingIndicator ?? true;

    if (showLoadingIndicator) {
      this.loading.set(true);
    }

    this.errorMessage.set('');

    this.bookingsService
      .getBookings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (showLoadingIndicator) {
            this.loading.set(false);
          }
        }),
      )
      .subscribe({
        next: (bookings) => {
          this.bookings.set(bookings);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractErrorMessage(error, 'Unable to load bookings.'),
          );
        },
      });
  }

  private extractErrorMessage(
    error: HttpErrorResponse,
    fallbackMessage: string,
  ): string {
    const payload = error.error;

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = payload.message;

      if (Array.isArray(message)) {
        return message.join(' ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return fallbackMessage;
  }
}
