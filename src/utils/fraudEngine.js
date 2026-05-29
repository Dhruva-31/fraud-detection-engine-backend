const prisma = require("../config/prisma");

const velocityCheck = async (id) => {
  // 3 transactions in last 60 secs
  const count = await prisma.transaction.count({
    where: {
      userId: id,
      timestamp: {
        gte: new Date(Date.now() - 60 * 1000)
      }
    }
  });

  if (count > 3) {
    return { points: 40, anomaly: "VELOCITY_BREACH" };
  }

  return null;
};

const amountAnomaly = async (amount, userId) => {
  // transaction amount > 3 times average amount
  const user = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
    select: { avgTransactionAmount: true }
  });

  if (!user || user.avgTransactionAmount === 0) return null;

  if (amount > 3 * user.avgTransactionAmount) {
    return { points: 30, anomaly: "AMOUNT_ANOMALY" };
  }

  return null;
};

const oddHour = () => {
  // transaction in midnyt
  const hour = new Date().getHours();

  if (hour >= 1 && hour <= 4) {
    return { points: 15, anomaly: "ODD_HOUR" };
  }

  return null;
};

const newCategory = async (category, id) => {
  // new category of transaction - shopping, etc
  const user = await prisma.userBehaviorProfile.findUnique({
    where: { userId: id },
    select: { commonCategories: true }
  });

  if (!user || !user.commonCategories) return null;

  const categoriesArray = user.commonCategories
    .split(",")
    .map((c) => c.trim().toLowerCase());

  if (!categoriesArray.includes(category.toLowerCase())) {
    return { points: 20, anomaly: "NEW_CATEGORY" };
  }

  return null;
};

const impossibleTravel = async (id, location) => {
  // location of transaction 30 mins before doesnt match the current transaction location
  const recentTransaction = await prisma.transaction.findFirst({
    where: {
      userId: id,
      timestamp: {
        gte: new Date(Date.now() - 30 * 60 * 1000)
      }
    },
    orderBy: { timestamp: "desc" }
  });

  if (
    recentTransaction &&
    recentTransaction.location.toLowerCase() !== location.toLowerCase()
  ) {
    return { points: 60, anomaly: "IMPOSSIBLE_TRAVEL" };
  }

  return null;
};

const roundAmount = (amount) => {
  if (amount % 1 === 0 && amount % 10 === 0) {
    return { points: 10, anomaly: "ROUND_AMOUNT" };
  }

  return null;
};

const runFraudEngine = async (transaction) => {
  const { userId, amount, category, location } = transaction;

  const results = await Promise.all([
    velocityCheck(userId),
    amountAnomaly(amount, userId),
    Promise.resolve(oddHour()),          
    newCategory(category, userId),
    impossibleTravel(userId, location),
    Promise.resolve(roundAmount(amount))  
  ]);

  const triggered = results.filter((result) => result !== null);

  const riskScore = triggered.reduce((sum, result) => sum + result.points, 0);

  const triggeredRules = triggered.map((result) => result.anomaly);

  let status;
  if (riskScore <= 30) {
    status = "CLEAN";
  } else if (riskScore <= 59) {
    status = "REVIEW";
  } else {
    status = "FLAGGED";
  }

  return { riskScore, triggeredRules, status };
};

module.exports = { runFraudEngine };