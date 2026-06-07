const express = require("express");
const router = express.Router();
const { register, login, getMe, refresh } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const catchAsync = require("../utils/catchAsync");

router.post("/api/auth/register", catchAsync(register));
router.post("/api/auth/login", catchAsync(login));
router.post("/api/auth/refresh", catchAsync(refresh));
router.get("/api/auth/me", protect, catchAsync(getMe));  

module.exports = router;