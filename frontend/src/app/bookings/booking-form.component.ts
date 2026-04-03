import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateBookingRequest } from './booking.model';

type BookingType = 'income' | 'expense';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css'],
})
export class BookingFormComponent {
  @Input() saving = false;
  @Output() bookingCreated = new EventEmitter<CreateBookingRequest>();

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

    this.bookingCreated.emit(payload);
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
}

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
