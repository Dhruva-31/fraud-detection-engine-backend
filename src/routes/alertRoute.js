const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getAllAlerts, getAlertsById, reviewAlert } = require("../controllers/alertController");
const catchAsync = require("../utils/catchAsync");
const router = express.Router();

router.get("/api/fraud/alerts", protect, catchAsync(getAllAlerts));
router.get("/api/fraud/alerts/:id", protect, catchAsync(getAlertsById));
router.put("/api/fraud/alerts/:id", protect, catchAsync(reviewAlert));

module.exports = router