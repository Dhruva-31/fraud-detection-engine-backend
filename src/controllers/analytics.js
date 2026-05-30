const {
  getSummaryService,
  getRuleBreakdownService,
  getWeeklyService,
} = require("../services/analyticsService");

const getSummary = async (req, res) => {
  const userId = req.user.userId;
  const summary = await getSummaryService(userId);
  res.status(200).json({
    message: "Analytics Summary retrieved successfully",
    summary,
  });
};

const getRuleBreakdown = async (req, res) => {
  const userId = req.user.userId;
  const breakdown = await getRuleBreakdownService(userId);
  res.status(200).json({
    message: "Rule Breakdown retrieved successfully",
    breakdown,
  });
};

const getWeekly = async (req, res) => {
  const userId = req.user.userId;
  const weekly = await getWeeklyService(userId);
  res.status(200).json({
    message: "Week transaction count retrieved successfully",
    weekly,
  });
};

module.exports = {
  getSummary,
  getRuleBreakdown,
  getWeekly,
};
