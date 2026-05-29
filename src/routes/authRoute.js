const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/api/auth/register", register);
router.post("/api/auth/login", login);
router.get("/api/auth/me", protect, getMe);  

module.exports = router;