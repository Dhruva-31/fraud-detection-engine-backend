-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('FRAUD', 'FALSE_POSITIVE');

-- AlterTable
ALTER TABLE "FraudAlert" ADD COLUMN     "outcome" "ReviewOutcome",
ADD COLUMN     "reviewNotes" TEXT;
