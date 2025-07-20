import express from "express";
const app = express();
import dotenv from "dotenv";
import connectDatabase from "./database/db.js";
import cors from "cors";

// Import routes
import authRoute from "./routes/authRoute.js";
import locationRoute from "./routes/locationRoute.js";
import potholeRoute from "./routes/potholeRoute.js";

// Configure environment variables
dotenv.config();

// Database connection
connectDatabase();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads")); // For serving uploaded files
app.use(
  cors({
    origin: "*", // Adjust this to your frontend URL in production
  })
);

// Routes
app.use("/api/auth", authRoute);
app.use("/api/location", locationRoute);
app.use("/api/potholes", potholeRoute);

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    apiEndpoints: {
      auth: "/api/auth",
      location: "/api/location",
      potholes: "/api/potholes",
    },
  });
});

// Error handling for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});
