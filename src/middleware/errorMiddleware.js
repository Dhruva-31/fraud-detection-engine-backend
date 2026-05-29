const AppError = require("../utils/AppError");

// ─── Handle specific Prisma errors ───────────────────────────
const handlePrismaError = (error) => {
  switch (error.code) {
    case "P2002":
      // Unique constraint — e.g. email already exists
      const field = error.meta?.target?.[0] || "field";
      return new AppError(`${field} already exists`, 409);

    case "P2025":
      // Record not found
      return new AppError("Record not found", 404);

    case "P2003":
      // Foreign key constraint failed
      return new AppError("Related record not found", 400);

    case "P2014":
      // Relation violation
      return new AppError("Invalid relation between records", 400);

    default:
      return new AppError("Database operation failed", 500);
  }
};

// ─── Handle JWT errors ────────────────────────────────────────
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Token expired. Please log in again.", 401);

// ─── Handle validation errors ────────────────────────────────
const handleValidationError = (error) => {
  const messages = Object.values(error.errors)
    .map((el) => el.message)
    .join(", ");
  return new AppError(`Validation failed: ${messages}`, 400);
};

// ─── Send error response ──────────────────────────────────────
const sendError = (err, res) => {
  // Operational errors — safe to send details to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown errors — don't leak details
  console.error("UNEXPECTED ERROR:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong. Please try again later.",
  });
};

// ─── Global error handler ─────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = Number(err.statusCode) || 500;
  err.status = err.status || "error";

  let error = { ...err, message: err.message, name: err.name };

  // Prisma errors
  if (error.code?.startsWith("P")) {
    error = handlePrismaError(error);
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    error = handleJWTError();
  }

  if (error.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  // Validation errors
  if (error.name === "ValidationError") {
    error = handleValidationError(error);
  }

  // SyntaxError — malformed JSON body
  if (error instanceof SyntaxError && error.status === 400) {
    error = new AppError("Invalid JSON in request body", 400);
  }

  sendError(error, res);
};

// ─── 404 handler — for undefined routes ──────────────────────
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

module.exports = { globalErrorHandler, notFoundHandler };