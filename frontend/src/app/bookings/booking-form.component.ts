import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking, BookingType, CreateBookingRequest } from './booking.model';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css'],
})
export class BookingFormComponent implements OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() booking: Booking | null = null;
  @Input() saving = false;
  @Output() bookingSubmitted = new EventEmitter<CreateBookingRequest>();
  @Output() editCancelled = new EventEmitter<void>();

  readonly form = new FormGroup({
    bookingDate: new FormControl(todayDateString(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    type: new FormControl<BookingType>('expense', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    text: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ('mode' in changes || 'booking' in changes) {
      this.applyInputState();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { bookingDate, type, amount, text } = this.form.getRawValue();
    const trimmedText = text.trim();

    if (!trimmedText) {
      this.form.controls.text.setErrors({ required: true });
      this.form.controls.text.markAsTouched();
      return;
    }

    if (amount === null) {
      this.form.controls.amount.markAsTouched();
      return;
    }

    const payload: CreateBookingRequest = {
      bookingDate,
      text: trimmedText,
      ...(type === 'income'
        ? { income: Number(amount) }
        : { expense: Number(amount) }),
    };

    this.bookingSubmitted.emit(payload);
  }

  cancelEdit(): void {
    if (this.saving) {
      return;
    }

    this.editCancelled.emit();
  }

  reset(): void {
    this.form.reset({
      bookingDate: todayDateString(),
      type: 'expense',
      amount: null,
      text: '',
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  get submitLabel(): string {
    if (this.mode === 'edit') {
      return this.saving ? 'Saving changes...' : 'Save changes';
    }

    return this.saving ? 'Saving...' : 'Add booking';
  }

  private applyInputState(): void {
    if (this.mode === 'edit' && this.booking) {
      this.form.reset({
        bookingDate: this.booking.bookingDate,
        type: this.booking.income !== null ? 'income' : 'expense',
        amount: this.booking.income ?? this.booking.expense,
        text: this.booking.text,
      });
      return;
    }

    this.reset();
  }
}

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
