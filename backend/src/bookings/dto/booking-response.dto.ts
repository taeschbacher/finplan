export class BookingResponseDto {
  id!: string;
  bookingDate!: string;
  income!: number | null;
  expense!: number | null;
  cashBalance!: number;
  text!: string;
  createdAt!: string;
}
