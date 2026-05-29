const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { globalErrorHandler, notFoundHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoute");
const transactionRoutes = require("./routes/transactionRoute");
const alertRoutes = require("./routes/alertRoute");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Make io accessible in routes later
app.set("io", io);

// Routes
app.use(authRoutes);
app.use(transactionRoutes);
app.use(alertRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

// Socket connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});
