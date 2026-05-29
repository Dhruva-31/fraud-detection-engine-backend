const { getAllAlertsService, getAlertsByIdService, reviewAlertService } = require("../services/alertService");


const getAllAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = req.query;
    const alerts = await getAllAlertsService(userId, query);
    res.status(200).json({
      message: "Flagged/Review Alerts retrieved successfully",
      count: alerts.length,
      alerts
    });
  } catch (error) {
    console.error("Alerts retrieval error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
}

const getAlertsById = async (req, res) => {
  try {
    const id = req.params.id
    const userId = req.user.userId
    const alert = await getAlertsByIdService(id, userId)
    res.status(200).json({
      message: "Alert retrieved successfully",
      alert
    });
  } catch (error) {
    console.error("Alert by id retrieval error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
}

const reviewAlert = async (req, res) => {
  try {
    const id = req.params.id
    const userId = req.user.userId
    const alert = await reviewAlertService(id, userId)
    res.status(200).json({
      message: "Alert reviewed successfully",
      alert
    });
  } catch (error) {
    console.error("Alert review retrieval error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
}

module.exports = {
  getAllAlerts,
  getAlertsById,
  reviewAlert
}