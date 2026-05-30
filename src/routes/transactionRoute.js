const express = require("express");
const { saveTransaction, getTransactions, getTransactionById } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const catchAsync = require("../utils/catchAsync");
const router = express.Router();

router.post("/api/transactions", protect, catchAsync(saveTransaction));
router.get("/api/transactions", protect, catchAsync(getTransactions));
router.get("/api/transactions/:id", protect, catchAsync(getTransactionById));

module.exports = router;