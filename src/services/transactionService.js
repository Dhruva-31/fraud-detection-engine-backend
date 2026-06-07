const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { runFraudEngine } = require("../utils/fraudEngine");

const saveTransactionService = async (transactionData, io) => {
  const { userId, amount, merchant, category, location } = transactionData;
  if (!amount || !merchant || !category || !location) {
    throw new AppError(
      "amount, merchant, category and location are required",
      400,
    );
  }

  const fraudResult = await runFraudEngine(transactionData);

  const transaction = await prisma.transaction.create({
    data: {
      amount,
      merchant,
      category,
      location,
      userId,
      status: fraudResult.status,
      riskScore: fraudResult.riskScore,
      triggeredRules: fraudResult.triggeredRules,
    },
    select: {
      id: true,
      userId: true,
      amount: true,
      merchant: true,
      category: true,
      location: true,
      status: true,
      riskScore: true,
      triggeredRules: true,
    },
  });

  if (fraudResult.status === "FLAGGED" || fraudResult.status === "REVIEW") {
    await prisma.fraudAlert.create({
      data: {
        transactionId: transaction.id,
      },
    });

    if (io && fraudResult.status === "FLAGGED") {
      io.to(`user_${userId}`).emit("fraud_alert", {
        transactionId: transaction.id,
        amount: transaction.amount,
        riskScore: fraudResult.riskScore,
        triggeredRules: fraudResult.triggeredRules,
      });
    }
  }

  await updateBehaviorProfile(userId, { amount, category, location });

  return { transaction, fraudResult };
};

const updateBehaviorProfile = async (userId, transaction) => {
  const { amount, category, location } = transaction;

  const profile = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
  });

  const avgResult = await prisma.transaction.aggregate({
    where: { userId },
    _avg: { amount: true },
  });

  const newAvg = avgResult._avg.amount || amount;

  const existingCategories = profile.commonCategories
    ? profile.commonCategories.split(",").map((c) => c.trim().toLowerCase())
    : [];

  const categoryLower = category.toLowerCase();

  if (!existingCategories.includes(categoryLower)) {
    existingCategories.push(categoryLower);
  }

  const updatedCategories = existingCategories.join(",");

  await prisma.userBehaviorProfile.update({
    where: { userId },
    data: {
      avgTransactionAmount: newAvg,
      commonCategories: updatedCategories,
      lastKnownLocation: location,
    },
  });
};

const getTransactionsService = async (userId) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
    },
    orderBy: { timestamp: "desc" },
    include: {
      fraudAlert: true,
    },
  });

  return transactions;
};

const getTransactionByIdService = async (id, userId) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      fraudAlert: true,
    },
  });

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  if (transaction.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  return transaction;
};

module.exports = {
  saveTransactionService,
  getTransactionsService,
  getTransactionByIdService,
};
