import Location from "../models/locationModel.js";

// Save a new location
export const saveLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, name } = req.body;
    const userId = req.user.id;
    //console.log(userId);

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "userId, latitude and longitude are required",
      });
    }

    const newLocation = await Location.create({
      userId,
      latitude,
      longitude,
      address: address || "",
      name: name || "",
    });

    res.status(201).json({
      message: "Location saved successfully",
      data: newLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving location",
      error: error.message,
    });
  }
};

// Get all locations for a user
export const getUserLocations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const locations = await Location.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Locations retrieved successfully",
      data: locations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving locations",
      error: error.message,
    });
  }
};

// Delete a location
export const deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;

    if (!locationId) {
      return res.status(400).json({
        message: "locationId is required",
      });
    }

    const deletedLocation = await Location.findByIdAndDelete(locationId);

    if (!deletedLocation) {
      return res.status(404).json({
        message: "Location not found",
      });
    }

    res.status(200).json({
      message: "Location deleted successfully",
      data: deletedLocation,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting location",
      error: error.message,
    });
  }
};
