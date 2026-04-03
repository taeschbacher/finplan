-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "booking_date" DATE NOT NULL,
    "income" DECIMAL(12,2),
    "expense" DECIMAL(12,2),
    "text" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_booking_date_created_at_idx" ON "bookings"("booking_date", "created_at");

-- AddCheckConstraint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_income_xor_expense_check"
  CHECK ((income IS NOT NULL AND expense IS NULL) OR (income IS NULL AND expense IS NOT NULL));

-- AddCheckConstraint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_positive_income_check"
  CHECK (income IS NULL OR income > 0);

-- AddCheckConstraint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_positive_expense_check"
  CHECK (expense IS NULL OR expense > 0);
