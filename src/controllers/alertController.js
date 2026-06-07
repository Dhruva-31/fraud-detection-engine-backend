const {
  getAllAlertsService,
  getAlertsByIdService,
  reviewAlertService,
} = require("../services/alertService");

const getAllAlerts = async (req, res) => {
  const userId = req.user.userId;
  const query = req.query;
  const alerts = await getAllAlertsService(userId, query);
  res.status(200).json({
    message: "Flagged/Review Alerts retrieved successfully",
    count: alerts.length,
    alerts,
  });
};

const getAlertsById = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.userId;
  const alert = await getAlertsByIdService(id, userId);
  res.status(200).json({
    message: "Alert retrieved successfully",
    alert,
  });
};

const reviewAlert = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.userId;
  const { outcome, reviewNotes } = req.body;
  const alert = await reviewAlertService(id, userId, outcome, reviewNotes);
  res.status(200).json({
    message: "Alert reviewed successfully",
    alert,
  });
};

module.exports = {
  getAllAlerts,
  getAlertsById,
  reviewAlert,
};
