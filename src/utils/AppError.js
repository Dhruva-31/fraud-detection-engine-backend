class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    // isOperational = true means this is a known, expected error
    // (wrong password, user not found, etc.)
    // vs a crash/bug which is unexpected

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;