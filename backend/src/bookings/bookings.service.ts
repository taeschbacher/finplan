import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

interface BookingResponse {
  id: string;
  bookingDate: string;
  income: number | null;
  expense: number | null;
  cashBalance: number;
  text: string;
  createdAt: string;
}

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BookingResponse[]> {
    const bookings = await this.prisma.booking.findMany({
      orderBy: [{ bookingDate: 'asc' }, { createdAt: 'asc' }],
    });

    return this.mapWithRunningBalance(bookings);
  }

  async create(createBookingDto: CreateBookingDto): Promise<BookingResponse> {
    this.validateCreateBookingDto(createBookingDto);

    const created = await this.prisma.booking.create({
      data: {
        bookingDate: parseDateOnly(createBookingDto.bookingDate),
        income: isProvided(createBookingDto.income)
          ? new Prisma.Decimal(createBookingDto.income)
          : null,
        expense: isProvided(createBookingDto.expense)
          ? new Prisma.Decimal(createBookingDto.expense)
          : null,
        text: createBookingDto.text.trim(),
      },
    });

    return this.findOneWithComputedBalance(created.id);
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.booking.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Booking ${id} was not found`);
      }

      throw error;
    }
  }

  private async findOneWithComputedBalance(id: string): Promise<BookingResponse> {
    const bookings = await this.prisma.booking.findMany({
      orderBy: [{ bookingDate: 'asc' }, { createdAt: 'asc' }],
    });

    const mapped = this.mapWithRunningBalance(bookings);
    const booking = mapped.find((entry) => entry.id === id);

    if (!booking) {
      throw new NotFoundException(`Booking ${id} was not found`);
    }

    return booking;
  }

  private mapWithRunningBalance(bookings: Booking[]): BookingResponse[] {
    let runningBalance = new Prisma.Decimal(0);

    return bookings.map((booking) => {
      const income = booking.income ?? new Prisma.Decimal(0);
      const expense = booking.expense ?? new Prisma.Decimal(0);
      runningBalance = runningBalance.plus(income).minus(expense);

      return this.toResponse(booking, runningBalance);
    });
  }

  private toResponse(booking: Booking, cashBalance: Prisma.Decimal): BookingResponse {
    return {
      id: booking.id,
      bookingDate: formatDateOnly(booking.bookingDate),
      income: booking.income ? booking.income.toNumber() : null,
      expense: booking.expense ? booking.expense.toNumber() : null,
      cashBalance: cashBalance.toNumber(),
      text: booking.text,
      createdAt: booking.createdAt.toISOString(),
    };
  }

  private validateCreateBookingDto(createBookingDto: CreateBookingDto): void {
    const hasIncome = isProvided(createBookingDto.income);
    const hasExpense = isProvided(createBookingDto.expense);

    if (hasIncome === hasExpense) {
      throw new BadRequestException(
        'Exactly one of income or expense must be provided',
      );
    }

    if (!createBookingDto.text.trim()) {
      throw new BadRequestException('text must not be empty');
    }

    parseDateOnly(createBookingDto.bookingDate);
  }
}

function isProvided(value: number | undefined): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new BadRequestException('bookingDate must use the YYYY-MM-DD format');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new BadRequestException('bookingDate must be a valid calendar date');
  }

  return parsed;
}

function formatDateOnly(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
