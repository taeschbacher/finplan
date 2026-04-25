import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
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
  private readonly currentYearValue = new Date().getFullYear();

  readonly bookings = signal<Booking[]>([]);
  readonly selectedYear = signal(this.currentYearValue);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingBookingId = signal<string | null>(null);
  readonly editingBooking = signal<Booking | null>(null);
  readonly editingBookingId = computed(() => this.editingBooking()?.id ?? null);
  readonly actionsDisabled = computed(
    () => this.saving() || this.deletingBookingId() !== null,
  );
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly availableYears = computed(() => {
    const years = new Set<number>();

    for (const booking of this.bookings()) {
      const year = this.getYearFromDateString(booking.bookingDate);

      if (year !== null) {
        years.add(year);
      }
    }

    return [...years].sort((left, right) => right - left);
  });

  readonly yearOptions = computed(() => {
    const years = new Set<number>([
      this.currentYearValue,
      this.selectedYear(),
      ...this.availableYears(),
    ]);

    return [...years].sort((left, right) => right - left);
  });

  readonly filteredBookings = computed(() => {
    const selectedYear = this.selectedYear();

    return this.bookings().filter(
      (booking) => this.getYearFromDateString(booking.bookingDate) === selectedYear,
    );
  });

  readonly filterSummary = computed(() => {
    const totalCount = this.bookings().length;
    const visibleCount = this.filteredBookings().length;
    const bookingLabel = totalCount === 1 ? 'booking' : 'bookings';

    return `Showing ${visibleCount} of ${totalCount} ${bookingLabel} for ${this.selectedYear()}. Cash balances remain all-time balances.`;
  });

  readonly tableEmptyMessage = computed(() => {
    if (this.bookings().length === 0) {
      return 'No bookings yet. Add your first booking using the form.';
    }

    return `No bookings found for ${this.selectedYear()}. Choose another available year or add a booking for this year.`;
  });

  ngOnInit(): void {
    this.loadBookings();
  }

  onBookingSubmitted(payload: CreateBookingRequest): void {
    const editingBooking = this.editingBooking();

    if (editingBooking) {
      this.updateBooking(editingBooking.id, payload);
      return;
    }

    this.createBooking(payload);
  }

  onStartEditing(booking: Booking): void {
    if (this.actionsDisabled()) {
      return;
    }

    this.editingBooking.set(booking);
    this.selectedYear.set(this.getYearFromDateString(booking.bookingDate) ?? this.selectedYear());
    this.clearMessages();
  }

  onCancelEditing(): void {
    this.editingBooking.set(null);
    this.clearMessages();
  }

  onYearSelected(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const selectedYear = Number(value);

    if (!Number.isInteger(selectedYear)) {
      return;
    }

    this.selectedYear.set(selectedYear);
    this.clearMessages();
  }

  onDeleteBooking(booking: Booking): void {
    if (this.actionsDisabled()) {
      return;
    }

    const confirmed = globalThis.confirm(
      `Delete the booking "${booking.text}" from ${booking.bookingDate}?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingBookingId.set(booking.id);
    this.clearMessages();

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
          if (this.editingBooking()?.id === booking.id) {
            this.editingBooking.set(null);
          }

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

  private createBooking(payload: CreateBookingRequest): void {
    this.saving.set(true);
    this.clearMessages();

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
          this.selectYearFromPayload(payload);
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

  private updateBooking(id: string, payload: CreateBookingRequest): void {
    this.saving.set(true);
    this.clearMessages();

    this.bookingsService
      .updateBooking(id, payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.editingBooking.set(null);
          this.selectYearFromPayload(payload);
          this.successMessage.set('Booking updated successfully.');
          this.loadBookings({ showLoadingIndicator: false });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractErrorMessage(error, 'Unable to update booking.'),
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

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private selectYearFromPayload(payload: CreateBookingRequest): void {
    const year = this.getYearFromDateString(payload.bookingDate);

    if (year !== null) {
      this.selectedYear.set(year);
    }
  }

  private getYearFromDateString(value: string): number | null {
    const match = /^(\d{4})-\d{2}-\d{2}$/.exec(value);

    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    return Number.isInteger(year) ? year : null;
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
