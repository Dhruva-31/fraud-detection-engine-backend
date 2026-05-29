const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getAllAlerts, getAlertsById, reviewAlert } = require("../controllers/alertController");
const router = express.Router();

router.get("/api/fraud/alerts", protect, getAllAlerts);
router.get("/api/fraud/alerts/:id", protect, getAlertsById);
router.put("/api/fraud/alerts/:id", protect, reviewAlert);

module.exports = router