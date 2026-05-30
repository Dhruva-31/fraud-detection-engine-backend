const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getSummary, getRuleBreakdown, getWeekly } = require("../controllers/analytics");
const catchAsync = require("../utils/catchAsync");

router.get("/api/analytics/summary", protect, catchAsync(getSummary));
router.get("/api/analytics/rule-breakdown", protect, catchAsync(getRuleBreakdown));
router.get("/api/analytics/weekly", protect, catchAsync(getWeekly));

module.exports = router;