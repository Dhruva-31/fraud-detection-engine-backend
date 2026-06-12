const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const getBehaviorProfileService = async (userId) => {
  const profile = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
  });

  return profile;
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
};

module.exports = {
  getBehaviorProfileService,
  updateBehaviorProfile,
};
