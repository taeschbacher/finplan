export type BookingType = 'income' | 'expense';

export interface Booking {
  id: string;
  bookingDate: string;
  income: number | null;
  expense: number | null;
  cashBalance: number;
  text: string;
  createdAt: string;
}

export interface BookingRequest {
  bookingDate: string;
  income?: number;
  expense?: number;
  text: string;
}

export type CreateBookingRequest = BookingRequest;
export type UpdateBookingRequest = Partial<BookingRequest>;
