-- CreateIndex
CREATE INDEX "bookings_bookingDate_idx" ON "bookings"("bookingDate");

-- CreateIndex
CREATE INDEX "bookings_isDeleted_idx" ON "bookings"("isDeleted");

-- CreateIndex
CREATE INDEX "categories_isDeleted_idx" ON "categories"("isDeleted");

-- CreateIndex
CREATE INDEX "reviews_isDeleted_idx" ON "reviews"("isDeleted");

-- CreateIndex
CREATE INDEX "services_isDeleted_idx" ON "services"("isDeleted");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isDeleted_idx" ON "users"("isDeleted");
