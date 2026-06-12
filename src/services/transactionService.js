const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { runFraudEngine } = require("../utils/fraudEngine");
const { updateBehaviorProfile } = require("./behaviourService");

const saveTransactionService = async (transactionData, io) => {
  const { userId, amount, merchant, category, location, latitude, longitude } =
    transactionData;
  if (
    !amount ||
    !merchant ||
    !category ||
    !location ||
    !latitude ||
    !longitude
  ) {
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
      latitude,
      longitude,
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
      latitude: true,
      longitude: true,
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

  if (fraudResult.status === "CLEAN")
    await updateBehaviorProfile(userId, { amount, category, location });

  return { transaction, fraudResult };
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
