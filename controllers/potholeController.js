import Pothole from "../models/potholeModel.js";
import User from "../models/userModel.js";
import geocoder from "../utils/geocoder.js"; // You'll need to implement this

// @desc    Create a new pothole report
// @route   POST /api/potholes
// @access  Private
export const createPothole = async (req, res) => {
  try {
    const { latitude, longitude, address, description, severity, size } =
      req.body;

    // Basic validation
    if (!latitude || !longitude || !address) {
      return res.status(400).json({
        success: false,
        message: "Please provide latitude, longitude, and address",
      });
    }

    // Create pothole with location data
    const pothole = await Pothole.create({
      createdBy: req.user.id,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      address,
      description,
      severity: severity || "medium",
      size: size || {},
      images: req.files?.map((file) => file.path) || [], // If using file uploads
    });

    res.status(201).json({
      success: true,
      data: pothole,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error creating pothole report",
    });
  }
};

// @desc    Get all potholes
// @route   GET /api/potholes
// @access  Public/Private (depending on your needs)
export const getPotholes = async (req, res) => {
  try {
    // Advanced filtering, sorting, pagination
    const queryObj = { ...req.query };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Geospatial query if coordinates provided
    if (req.query.latitude && req.query.longitude) {
      const { latitude, longitude, distance = 5000 } = req.query;
      queryObj.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(distance),
        },
      };
    }

    let query = Pothole.find(queryObj).populate("createdBy", "name email");

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    const potholes = await query;
    const total = await Pothole.countDocuments(queryObj);

    res.status(200).json({
      success: true,
      count: potholes.length,
      total,
      pages: Math.ceil(total / limit),
      data: potholes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error fetching potholes",
    });
  }
};

// @desc    Get single pothole
// @route   GET /api/potholes/:id
// @access  Public
export const getPothole = async (req, res) => {
  try {
    const pothole = await Pothole.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("comments.user", "name");

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: "Pothole not found",
      });
    }

    res.status(200).json({
      success: true,
      data: pothole,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error fetching pothole",
    });
  }
};

// @desc    Update pothole
// @route   PUT /api/potholes/:id
// @access  Private (Admin or Creator)
export const updatePothole = async (req, res) => {
  try {
    let pothole = await Pothole.findById(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: "Pothole not found",
      });
    }

    // Verify ownership or admin status
    if (
      pothole.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this pothole",
      });
    }

    // Special handling for status changes
    if (req.body.status === "verified" && req.user.role === "admin") {
      req.body.verifiedBy = req.user.id;
      req.body.verifiedAt = Date.now();
    }

    if (req.body.status === "fixed") {
      req.body.fixedAt = Date.now();
    }

    pothole = await Pothole.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: pothole,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error updating pothole",
    });
  }
};

// @desc    Delete pothole
// @route   DELETE /api/potholes/:id
// @access  Private (Admin or Creator)
export const deletePothole = async (req, res) => {
  try {
    const pothole = await Pothole.findById(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: "Pothole not found",
      });
    }

    // Verify ownership or admin status
    if (
      pothole.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this pothole",
      });
    }

    await pothole.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error deleting pothole",
    });
  }
};

// @desc    Vote on pothole
// @route   PUT /api/potholes/:id/vote
// @access  Private
export const voteOnPothole = async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'

    if (!["upvote", "downvote"].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "Please provide either 'upvote' or 'downvote'",
      });
    }

    const pothole = await Pothole.findById(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: "Pothole not found",
      });
    }

    // Check if user already voted
    const existingVote = pothole.votes.users.find(
      (v) => v.user.toString() === req.user.id
    );

    if (existingVote) {
      // Remove previous vote if same type
      if (existingVote.voteType === voteType) {
        pothole.votes.users = pothole.votes.users.filter(
          (v) => v.user.toString() !== req.user.id
        );

        if (voteType === "upvote") {
          pothole.votes.upvotes--;
        } else {
          pothole.votes.downvotes--;
        }
      } else {
        // Change vote type
        existingVote.voteType = voteType;
        if (voteType === "upvote") {
          pothole.votes.upvotes++;
          pothole.votes.downvotes--;
        } else {
          pothole.votes.upvotes--;
          pothole.votes.downvotes++;
        }
      }
    } else {
      // Add new vote
      pothole.votes.users.push({ user: req.user.id, voteType });
      if (voteType === "upvote") {
        pothole.votes.upvotes++;
      } else {
        pothole.votes.downvotes++;
      }
    }

    await pothole.save();

    res.status(200).json({
      success: true,
      data: {
        upvotes: pothole.votes.upvotes,
        downvotes: pothole.votes.downvotes,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error processing vote",
    });
  }
};

// @desc    Add comment to pothole
// @route   POST /api/potholes/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Please provide comment text",
      });
    }

    const pothole = await Pothole.findById(req.params.id);

    if (!pothole) {
      return res.status(404).json({
        success: false,
        message: "Pothole not found",
      });
    }

    const comment = {
      user: req.user.id,
      text,
    };

    pothole.comments.push(comment);
    await pothole.save();

    // Populate user info in the response
    const populatedComment = {
      ...comment,
      user: {
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      createdAt: new Date(),
    };

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error adding comment",
    });
  }
};

// @desc    Get pothole statistics
// @route   GET /api/potholes/stats
// @access  Public/Admin
export const getPotholeStats = async (req, res) => {
  try {
    const stats = await Pothole.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
          avgDepth: { $avg: "$size.depth" },
          avgWidth: { $avg: "$size.width" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          bySeverity: { $push: { severity: "$_id", count: "$count" } },
          avgDepth: { $avg: "$avgDepth" },
          avgWidth: { $avg: "$avgWidth" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          bySeverity: 1,
          avgDepth: 1,
          avgWidth: 1,
        },
      },
    ]);

    const statusStats = await Pothole.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...stats[0],
        byStatus: statusStats,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error fetching statistics",
    });
  }
};
