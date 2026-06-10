const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { runFraudEngine } = require("../utils/fraudEngine");

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

const updateBehaviorProfile = async (userId, transaction) => {
  const { amount, category, location } = transaction;

  const profile = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
  });

  const currentHour = new Date().getHours();

  if (!profile) {
    await prisma.userBehaviorProfile.create({
      data: {
        userId,
        avgTransactionAmount: amount,
        transactionStdDev: 0,
        commonCategories: category.toLowerCase(),
        lastKnownLocation: location,
        activeHours: `${currentHour}-${currentHour}`,
      },
    });

    return;
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      status: "CLEAN",
    },
    select: {
      amount: true,
    },
  });

  if (transactions.length === 0) return;

  const amounts = transactions.map((t) => t.amount);

  const avg = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

  const variance =
    amounts.reduce((sum, amount) => {
      return sum + Math.pow(amount - avg, 2);
    }, 0) / amounts.length;

  const stdDev = Math.sqrt(variance);

  const existingCategories = profile.commonCategories
    ? profile.commonCategories.split(",").map((c) => c.trim().toLowerCase())
    : [];

  const categoryLower = category.toLowerCase();

  if (!existingCategories.includes(categoryLower)) {
    existingCategories.push(categoryLower);
  }

  const updatedCategories = existingCategories.join(",");

  let updatedActiveHours;

  if (!profile.activeHours) {
    updatedActiveHours = `${currentHour}-${currentHour}`;
  } else {
    const [start, end] = profile.activeHours.split("-").map(Number);

    const newStart = Math.min(start, currentHour);
    const newEnd = Math.max(end, currentHour);

    updatedActiveHours = `${newStart}-${newEnd}`;
  }

  await prisma.userBehaviorProfile.update({
    where: { userId },
    data: {
      avgTransactionAmount: avg,
      transactionStdDev: stdDev,
      commonCategories: updatedCategories,
      lastKnownLocation: location,
      activeHours: updatedActiveHours,
    },
  });
  const Uprofile = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
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
  updateBehaviorProfile,
};
