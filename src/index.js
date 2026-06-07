const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const {
  globalErrorHandler,
  notFoundHandler,
} = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoute");
const transactionRoutes = require("./routes/transactionRoute");
const alertRoutes = require("./routes/alertRoute");
const analyticsRoutes = require("./routes/analyticsRoute");

const requestLogger = require("./middleware/requestLoggerMiddleware");
const logger = require("./config/logger");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
  },
});

const allowedOrigins = ["http://localhost:5173", process.env.FRONTEND_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use(requestLogger);

// Make io accessible in routes later
app.set("io", io);

// Routes
app.use(authRoutes);
app.use(transactionRoutes);
app.use(alertRoutes);
app.use(analyticsRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

// Socket connection
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  socket.on("join_room", (data) => {
    socket.join(`user_${data.userId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});
