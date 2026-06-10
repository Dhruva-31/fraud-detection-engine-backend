const prisma = require("../config/prisma");
const { getDistance } = require("geolib");

const velocityCheck = async (id) => {
  // 3 transactions in last 60 secs
  const count = await prisma.transaction.count({
    where: {
      userId: id,
      timestamp: {
        gte: new Date(Date.now() - 60 * 1000),
      },
    },
  });

  if (count > 3) {
    return { points: 40, anomaly: "VELOCITY_BREACH" };
  }

  return null;
};

const amountAnomaly = async (amount, userId) => {
  const profile = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
    select: {
      avgTransactionAmount: true,
      transactionStdDev: true,
    },
  });

  if (
    !profile ||
    profile.avgTransactionAmount === 0 ||
    profile.transactionStdDev === 0
  ) {
    return null;
  }

  const zScore = Math.abs(
    (amount - profile.avgTransactionAmount) / profile.transactionStdDev,
  );

  if (zScore > 5) {
    return {
      points: 50,
      anomaly: "AMOUNT_ANOMALY",
    };
  }

  if (zScore > 3) {
    return {
      points: 30,
      anomaly: "AMOUNT_ANOMALY",
    };
  }

  return null;
};

const oddHour = async (userId) => {
  const profile = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
    select: {
      activeHours: true,
    },
  });

  if (!profile?.activeHours) {
    return null;
  }

  const currentHour = new Date().getHours();

  const [start, end] = profile.activeHours.split("-").map(Number);

  if (currentHour < start || currentHour > end) {
    return {
      points: 20,
      anomaly: "ODD_HOUR",
    };
  }

  return null;
};

const newCategory = async (category, id) => {
  // new category of transaction - shopping, etc
  const user = await prisma.userBehaviorProfile.findUnique({
    where: { userId: id },
    select: { commonCategories: true },
  });

  if (!user || !user.commonCategories) return null;

  const categoriesArray = user.commonCategories
    .split(",")
    .map((c) => c.trim().toLowerCase());

  if (!categoriesArray.includes(category.toLowerCase())) {
    return { points: 15, anomaly: "NEW_CATEGORY" };
  }

  return null;
};

const impossibleTravel = async (current) => {
  // location of last transaction
  const prev = await prisma.transaction.findFirst({
    where: {
      userId: current.userId,
      timestamp: {
        lt: current.timestamp,
      },
    },
    orderBy: { timestamp: "desc" },
  });

  if (!prev) {
    return null;
  }

  const distanceMeters = getDistance(
    {
      latitude: prev.latitude,
      longitude: prev.longitude,
    },
    {
      latitude: current.latitude,
      longitude: current.longitude,
    },
  );

  const distanceKm = distanceMeters / 1000;

  const currentTime = current.timestamp || new Date();

  const hoursElapsed = (currentTime - prev.timestamp) / (1000 * 60 * 60);
  if (hoursElapsed <= 0) {
    return null;
  }

  const speed = distanceKm / hoursElapsed;

  if (speed > 2000) {
    return {
      points: 60,
      anomaly: "IMPOSSIBLE_TRAVEL",
    };
  } else if (speed > 900) {
    return {
      points: 40,
      anomaly: "IMPOSSIBLE_TRAVEL",
    };
  } else if (speed > 500) {
    return {
      points: 20,
      anomaly: "IMPOSSIBLE_TRAVEL",
    };
  }

  return null;
};

const locationAnomaly = async (location, userId) => {
  const profile = await prisma.userBehaviorProfile.findUnique({
    where: { userId },
    select: {
      lastKnownLocation: true,
    },
  });

  if (!profile?.lastKnownLocation) {
    return null;
  }

  if (profile.lastKnownLocation.toLowerCase() !== location.toLowerCase()) {
    return {
      points: 15,
      anomaly: "LOCATION_ANOMALY",
    };
  }

  return null;
};

const runFraudEngine = async (transaction) => {
  const { userId, amount, category, location } = transaction;

  const results = await Promise.all([
    velocityCheck(userId),
    amountAnomaly(amount, userId),
    oddHour(userId),
    newCategory(category, userId),
    impossibleTravel(transaction),
    locationAnomaly(location, userId),
  ]);

  const triggered = results.filter((result) => result !== null);

  const riskScore = triggered.reduce((sum, result) => sum + result.points, 0);

  const triggeredRules = triggered.map((result) => ({
    rule: result.anomaly,
    points: result.points,
  }));

  let status;
  if (riskScore <= 39) {
    status = "CLEAN";
  } else if (riskScore <= 79) {
    status = "REVIEW";
  } else {
    status = "FLAGGED";
  }

  return { riskScore, triggeredRules, status };
};

module.exports = { runFraudEngine };
