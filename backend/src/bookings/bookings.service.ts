import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

type MutableBookingInput = {
  bookingDate: string;
  income?: number;
  expense?: number;
  text: string;
};

type PersistedBookingInput = {
  bookingDate: Date;
  income: Prisma.Decimal | null;
  expense: Prisma.Decimal | null;
  text: string;
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<BookingResponseDto[]> {
    const bookings = await this.prisma.booking.findMany({
      orderBy: [{ bookingDate: 'asc' }, { createdAt: 'asc' }],
    });

    return this.mapWithRunningBalance(bookings);
  }

  async create(createBookingDto: CreateBookingDto): Promise<BookingResponseDto> {
    const created = await this.prisma.booking.create({
      data: this.normalizeBookingInput(createBookingDto),
    });

    return this.findOneWithComputedBalance(created.id);
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Booking ${id} was not found`);
    }

    await this.prisma.booking.update({
      where: { id },
      data: this.normalizeBookingInput(
        this.mergeBookingInput(existing, updateBookingDto),
      ),
    });

    return this.findOneWithComputedBalance(id);
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

  private async findOneWithComputedBalance(id: string): Promise<BookingResponseDto> {
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

  private normalizeBookingInput(input: MutableBookingInput): PersistedBookingInput {
    this.validateBookingInput(input);

    return {
      bookingDate: parseDateOnly(input.bookingDate),
      income: isProvided(input.income)
        ? new Prisma.Decimal(input.income)
        : null,
      expense: isProvided(input.expense)
        ? new Prisma.Decimal(input.expense)
        : null,
      text: input.text.trim(),
    };
  }

  private mergeBookingInput(
    existing: Booking,
    updateBookingDto: UpdateBookingDto,
  ): MutableBookingInput {
    const bookingDate = hasOwn(updateBookingDto, 'bookingDate')
      ? (updateBookingDto.bookingDate ?? formatDateOnly(existing.bookingDate))
      : formatDateOnly(existing.bookingDate);

    const text = hasOwn(updateBookingDto, 'text')
      ? (updateBookingDto.text ?? existing.text)
      : existing.text;

    if (hasOwn(updateBookingDto, 'income') || hasOwn(updateBookingDto, 'expense')) {
      return {
        bookingDate,
        text,
        ...(isProvided(updateBookingDto.income)
          ? { income: updateBookingDto.income }
          : {}),
        ...(isProvided(updateBookingDto.expense)
          ? { expense: updateBookingDto.expense }
          : {}),
      };
    }

    return {
      bookingDate,
      text,
      ...(existing.income ? { income: existing.income.toNumber() } : {}),
      ...(existing.expense ? { expense: existing.expense.toNumber() } : {}),
    };
  }

  private mapWithRunningBalance(bookings: Booking[]): BookingResponseDto[] {
    let runningBalance = new Prisma.Decimal(0);

    return bookings.map((booking) => {
      const income = booking.income ?? new Prisma.Decimal(0);
      const expense = booking.expense ?? new Prisma.Decimal(0);
      runningBalance = runningBalance.plus(income).minus(expense);

      return this.toResponse(booking, runningBalance);
    });
  }

  private toResponse(booking: Booking, cashBalance: Prisma.Decimal): BookingResponseDto {
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

  private validateBookingInput(input: MutableBookingInput): void {
    const hasIncome = isProvided(input.income);
    const hasExpense = isProvided(input.expense);

    if (hasIncome === hasExpense) {
      throw new BadRequestException(
        'Exactly one of income or expense must be provided',
      );
    }

    if (!input.text.trim()) {
      throw new BadRequestException('text must not be empty');
    }

    parseDateOnly(input.bookingDate);
  }
}

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isProvided(value: number | null | undefined): value is number {
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
