-- CreateTable
CREATE TABLE "Jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "posted_date" TIMESTAMP(3) NOT NULL,
    "jobUrl" TEXT NOT NULL,

    CONSTRAINT "Jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jobs_jobUrl_key" ON "Jobs"("jobUrl");

-- CreateIndex
CREATE INDEX "Jobs_company_idx" ON "Jobs"("company");

-- CreateIndex
CREATE INDEX "Jobs_location_idx" ON "Jobs"("location");

-- CreateIndex
CREATE INDEX "Jobs_posted_date_idx" ON "Jobs"("posted_date");
