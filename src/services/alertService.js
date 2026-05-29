const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const { getTransactionsService } = require("./transactionService");

const getAllAlertsService = async (userId, query) => {
  const where = {
    transaction: { userId }
  };

  if (query.reviewed !== undefined) {
    where.reviewed = query.reviewed === "true";
  }

  const alerts = await prisma.fraudAlert.findMany({
    where,
    include: {
      transaction: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return alerts;
}

const getAlertsByIdService = async (id, userId) => {
  const alert = await prisma.fraudAlert.findFirst({
    where: {
      id
    },
    include: {
      transaction: true
    }
  })

  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  if(alert.transaction.userId !== userId){
    throw new AppError("Forbidden", 403);
  }

  return alert;
}

const reviewAlertService = async (id, userId, data) => {
  const alert = await prisma.fraudAlert.findUnique({
    where: { id },
    include: { transaction: true }
  });

  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  if (alert.transaction.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  if (alert.reviewed) {
    throw new AppError("Alert already reviewed", 400);
  }

  const [reviewedAlert] = await prisma.$transaction([
    prisma.fraudAlert.update({
      where: { id },
      data: { reviewed: true },  
      include: { transaction: true }
    }),
    prisma.transaction.update({
      where: { id: alert.transactionId },
      data: { status: "CLEAN" }
    })
  ]);

  return reviewedAlert;
}

module.exports = {
  getAllAlertsService,
  getAlertsByIdService,
  reviewAlertService
}