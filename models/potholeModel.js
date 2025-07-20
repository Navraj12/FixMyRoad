import mongoose from "mongoose";

const potholeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot be more than 500 characters"],
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  size: {
    width: Number, // in centimeters
    depth: Number, // in centimeters
  },
  status: {
    type: String,
    enum: ["reported", "verified", "in-progress", "fixed"],
    default: "reported",
  },
  images: [String], // Array of image URLs
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  verifiedAt: Date,
  fixedAt: Date,
  votes: {
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create 2dsphere index for geospatial queries
potholeSchema.index({ location: "2dsphere" });

const Pothole = mongoose.model("Pothole", potholeSchema);

export default Pothole;
