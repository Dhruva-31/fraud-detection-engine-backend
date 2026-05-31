const logger = require("../config/logger");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const getSummaryService = async (userId) => {
  const result = await prisma.transaction.groupBy({
    by: ["status"],
    where: {
      userId,
    },
    _count: {
      status: true,
    },
  });

  const summary = { clean: 0, review: 0, flagged: 0, total: 0 };

  result.forEach((item) => {
    const key = item.status.toLowerCase();
    summary[key] = item._count.status;
    summary.total += item._count.status;
  });

  return summary;
};

const getRuleBreakdownService = async (userId) => {
  const alerts = await prisma.fraudAlert.findMany({
    where: {
      transaction: { userId },
    },
    select: {
      triggeredRules: true,
    },
  });

  if (alerts.length === 0) {
    return [];
  }

  const ruleCount = {};

  alerts.forEach((alert) => {
    alert.triggeredRules.split(",").forEach((rule) => {
      const trimmed = rule.trim();
      ruleCount[trimmed] = (ruleCount[trimmed] || 0) + 1;
    });
  });

  const breakdown = Object.entries(ruleCount)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);

  return breakdown;
};

const getWeeklyService = async (userId) => {
  const result = await prisma.$queryRaw`
    select date(timestamp) as date, 
    count(*)::int as count 
    from "Transaction"
    where "userId" = ${userId} 
    and timestamp >= now() - INTERVAl '7 days'
    group by date(timestamp)
    order by date asc
  `;

  return result;
};

module.exports = {
  getSummaryService,
  getRuleBreakdownService,
  getWeeklyService
};
