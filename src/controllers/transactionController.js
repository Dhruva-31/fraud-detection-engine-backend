const {
  saveTransactionService,
  getTransactionsService,
  getTransactionByIdService,
} = require("../services/transactionService");

const saveTransaction = async (req, res) => {
  const userId = req.user.userId;
  const io = req.app.get("io");

  const { transaction, fraudResult } = await saveTransactionService({
    ...req.body,
    userId
  }, io);

  res.status(201).json({
    message: "Transaction saved successfully",
    transaction,
    fraudResult,
  });
};

const getTransactions = async (req, res) => {
  const userId = req.user.userId;

  const transactions = await getTransactionsService(userId);

  res.status(200).json({
    message: "Transactions retrievel successfully",
    count: transactions.length,
    transactions,
  });
};

const getTransactionById = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.userId;

  const transaction = await getTransactionByIdService(id, userId);
  console.log(transaction);

  res.status(200).json({
    message: "Transaction retrievel successfully",
    transaction,
  });
};

module.exports = {
  saveTransaction,
  getTransactions,
  getTransactionById,
};
