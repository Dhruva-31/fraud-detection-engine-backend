const express = require("express");
const { saveTransaction, getTransactions, getTransactionById } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/api/transactions", protect, saveTransaction);
router.get("/api/transactions", protect, getTransactions);
router.get("/api/transactions/:id", protect, getTransactionById);

module.exports = router;