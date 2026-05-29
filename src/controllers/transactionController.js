const { saveTransactionService, getTransactionsService, getTransactionByIdService } = require("../services/transactionService");

const saveTransaction = async (req, res) => {
  try {
    const userId = req.user.userId
    
    const  { transaction, fraudResult } = await saveTransactionService({...req.body, userId});

    res.status(201).json({
      message: "Transaction saved successfully",
      transaction,
      fraudResult
    });
    
  } catch (error) {
    console.error("Save Transaction error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
}

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId

    const transactions = await getTransactionsService(userId);

    res.status(200).json({
      message: "Transactions retrievel successfully",
      count: transactions.length,
      transactions
    });
    
  } catch (error) {
    console.error("Get Transaction error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
}


const getTransactionById = async (req, res) => {
  try {
    const id = req.params.id
    const userId = req.user.userId

    const transaction = await getTransactionByIdService(id, userId);
    console.log(transaction)

    res.status(200).json({
      message: "Transaction retrievel successfully",
      transaction
    });
    
  } catch (error) {
    console.error("Get Transaction error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
}

module.exports = {
  saveTransaction,
  getTransactions,
  getTransactionById
}