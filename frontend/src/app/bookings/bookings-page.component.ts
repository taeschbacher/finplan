import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
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

  bookings: Booking[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadBookings();
  }

  onCreateBooking(payload: CreateBookingRequest): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.bookingsService
      .createBooking(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Booking saved successfully.';
          this.bookingForm?.reset();
          this.loadBookings();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(
            error,
            'Unable to save booking.',
          );
        },
      });
  }

  private loadBookings(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bookingsService
      .getBookings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (bookings) => {
          this.bookings = bookings;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(
            error,
            'Unable to load bookings.',
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
