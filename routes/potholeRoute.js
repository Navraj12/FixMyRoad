import express from "express";
import {
  createPothole,
  getPotholes,
  getPothole,
  updatePothole,
  deletePothole,
  voteOnPothole,
  addComment,
  getPotholeStats,
} from "../controllers/potholeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getPotholes).post(protect, createPothole);

router.route("/stats").get(getPotholeStats);

router
  .route("/:id")
  .get(getPothole)
  .put(protect, updatePothole)
  .delete(protect, deletePothole);

router.route("/:id/vote").put(protect, voteOnPothole);

router.route("/:id/comments").post(protect, addComment);

export default router;
