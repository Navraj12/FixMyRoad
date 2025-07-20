import express from "express";
import {
  saveLocation,
  getUserLocations,
  deleteLocation,
} from "../controllers/locationController.js";
import { protect } from "../middleware/authMiddleware.js"; // Assuming you have auth middleware

const router = express.Router();

// Protect all routes with authentication middleware
router.use(protect);

// Save a new location
router.post("/", saveLocation);

// Get all locations for a user
router.get("/user/:userId", getUserLocations);

// Delete a location
router.delete("/:locationId", deleteLocation);

export default router;
