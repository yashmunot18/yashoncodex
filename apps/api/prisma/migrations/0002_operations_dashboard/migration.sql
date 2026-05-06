-- Business planning / CRM / profitability dashboard
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD');

CREATE TABLE "BusinessBranch" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessBranch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RevenueStream" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RevenueStream_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MonthlyRevenueTarget" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "streamId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyRevenueTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MonthlyRevenueActual" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "streamId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyRevenueActual_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExpenseCategory" (
  "id" TEXT NOT NULL,
  "centerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MonthlyCostTarget" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "expenseCategoryId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyCostTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MonthlyCostActual" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "expenseCategoryId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MonthlyCostActual_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "revenueStreamId" TEXT,
  "contactName" TEXT NOT NULL,
  "companyName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "projectDescription" TEXT,
  "estimatedTurnover" DECIMAL(14,2),
  "estimatedExecution" TIMESTAMP(3),
  "nextFollowUp" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessBranch_centerId_name_key" ON "BusinessBranch"("centerId", "name");
CREATE INDEX "BusinessBranch_centerId_displayOrder_idx" ON "BusinessBranch"("centerId", "displayOrder");
CREATE UNIQUE INDEX "RevenueStream_centerId_name_key" ON "RevenueStream"("centerId", "name");
CREATE INDEX "RevenueStream_centerId_displayOrder_idx" ON "RevenueStream"("centerId", "displayOrder");
CREATE UNIQUE INDEX "MonthlyRevenueTarget_branchId_streamId_month_key" ON "MonthlyRevenueTarget"("branchId", "streamId", "month");
CREATE INDEX "MonthlyRevenueTarget_month_idx" ON "MonthlyRevenueTarget"("month");
CREATE UNIQUE INDEX "MonthlyRevenueActual_branchId_streamId_month_key" ON "MonthlyRevenueActual"("branchId", "streamId", "month");
CREATE INDEX "MonthlyRevenueActual_month_idx" ON "MonthlyRevenueActual"("month");
CREATE UNIQUE INDEX "ExpenseCategory_centerId_name_key" ON "ExpenseCategory"("centerId", "name");
CREATE INDEX "ExpenseCategory_centerId_displayOrder_idx" ON "ExpenseCategory"("centerId", "displayOrder");
CREATE UNIQUE INDEX "MonthlyCostTarget_branchId_expenseCategoryId_month_key" ON "MonthlyCostTarget"("branchId", "expenseCategoryId", "month");
CREATE INDEX "MonthlyCostTarget_month_idx" ON "MonthlyCostTarget"("month");
CREATE UNIQUE INDEX "MonthlyCostActual_branchId_expenseCategoryId_month_key" ON "MonthlyCostActual"("branchId", "expenseCategoryId", "month");
CREATE INDEX "MonthlyCostActual_month_idx" ON "MonthlyCostActual"("month");
CREATE INDEX "Lead_branchId_status_idx" ON "Lead"("branchId", "status");
CREATE INDEX "Lead_estimatedExecution_idx" ON "Lead"("estimatedExecution");

ALTER TABLE "BusinessBranch" ADD CONSTRAINT "BusinessBranch_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RevenueStream" ADD CONSTRAINT "RevenueStream_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyRevenueTarget" ADD CONSTRAINT "MonthlyRevenueTarget_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "BusinessBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyRevenueTarget" ADD CONSTRAINT "MonthlyRevenueTarget_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "RevenueStream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyRevenueActual" ADD CONSTRAINT "MonthlyRevenueActual_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "BusinessBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyRevenueActual" ADD CONSTRAINT "MonthlyRevenueActual_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "RevenueStream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyCostTarget" ADD CONSTRAINT "MonthlyCostTarget_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "BusinessBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyCostTarget" ADD CONSTRAINT "MonthlyCostTarget_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyCostActual" ADD CONSTRAINT "MonthlyCostActual_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "BusinessBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MonthlyCostActual" ADD CONSTRAINT "MonthlyCostActual_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "BusinessBranch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_revenueStreamId_fkey" FOREIGN KEY ("revenueStreamId") REFERENCES "RevenueStream"("id") ON DELETE SET NULL ON UPDATE CASCADE;
