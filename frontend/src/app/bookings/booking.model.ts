export interface Booking {
  id: string;
  bookingDate: string;
  income: number | null;
  expense: number | null;
  cashBalance: number;
  text: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  bookingDate: string;
  income?: number;
  expense?: number;
  text: string;
}
