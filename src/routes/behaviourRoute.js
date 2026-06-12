const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const catchAsync = require("../utils/catchAsync");
const { getBehaviorProfile } = require("../controllers/behaviourController");

router.get("/api/profile", protect, catchAsync(getBehaviorProfile));

module.exports = router;