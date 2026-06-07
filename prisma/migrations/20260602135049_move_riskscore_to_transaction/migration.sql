/*
  Warnings:

  - You are about to drop the column `riskScore` on the `FraudAlert` table. All the data in the column will be lost.
  - You are about to drop the column `triggeredRules` on the `FraudAlert` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FraudAlert" DROP COLUMN "riskScore",
DROP COLUMN "triggeredRules";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "triggeredRules" TEXT NOT NULL DEFAULT '';
