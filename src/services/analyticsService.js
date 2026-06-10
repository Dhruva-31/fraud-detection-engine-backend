const logger = require("../config/logger");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const getSummaryService = async (userId) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [
    totalTransactions,
    avgRiskScore,
    totalAlerts,
    reviewedAlerts,
    fraudCount,
    falsePositiveCount,
  ] = await Promise.all([
    prisma.transaction.count({
      where: {
        userId,
        timestamp: {
          gte: oneWeekAgo,
        },
      },
    }),

    prisma.transaction.aggregate({
      where: {
        userId,
        timestamp: {
          gte: oneWeekAgo,
        },
      },
      _avg: {
        riskScore: true,
      },
    }),

    prisma.fraudAlert.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
        transaction: {
          userId,
        },
      },
    }),

    prisma.fraudAlert.count({
      where: {
        reviewed: true,
        createdAt: {
          gte: oneWeekAgo,
        },
        transaction: {
          userId,
        },
      },
    }),

    prisma.fraudAlert.count({
      where: {
        outcome: "FRAUD",
        createdAt: {
          gte: oneWeekAgo,
        },
        transaction: {
          userId,
        },
      },
    }),

    prisma.fraudAlert.count({
      where: {
        outcome: "FALSE_POSITIVE",
        createdAt: {
          gte: oneWeekAgo,
        },
        transaction: {
          userId,
        },
      },
    }),
  ]);

  const falsePositiveRate =
    reviewedAlerts === 0
      ? 0
      : Number(((falsePositiveCount / reviewedAlerts) * 100).toFixed(1));

  return {
    totalTransactions,
    totalAlerts,
    reviewedAlerts,
    fraud: fraudCount,
    falsePositives: falsePositiveCount,
    falsePositiveRate,
    avgRiskScore: Number(avgRiskScore._avg.riskScore || 0).toFixed(1),
  };
};

const getRuleBreakdownService = async (userId) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      timestamp: {
        gte: oneWeekAgo,
      },
      fraudAlert: {
        isNot: null,
      },
    },
    select: {
      triggeredRules: true,
    },
  });

  const ruleCount = {};

  transactions.forEach((tx) => {
    if (!tx.triggeredRules) return;
    tx.triggeredRules.forEach((trigger) => {
      const rule = trigger.rule;
      ruleCount[rule] = (ruleCount[rule] || 0) + 1;
    });
  });

  return Object.entries(ruleCount)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);
};

const getWeeklyService = async (userId) => {
  const result = await prisma.$queryRaw`
    SELECT
      DATE(timestamp) as date,
      COUNT(*)::int as count
    FROM "Transaction"
    WHERE "userId" = ${userId}
      AND timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(timestamp)
    ORDER BY DATE(timestamp)
  `;

  const map = {};

  result.forEach((item) => {
    const key = new Date(item.date).toISOString().split("T")[0];
    map[key] = item.count;
  });

  const weekly = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);

    const key = day.toISOString().split("T")[0];

    weekly.push({
      date: key,
      count: map[key] || 0,
    });
  }

  return weekly;
};

module.exports = {
  getSummaryService,
  getRuleBreakdownService,
  getWeeklyService,
};
