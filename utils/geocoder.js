import axios from "axios";
import NodeGeocoder from "node-geocoder";
import dotenv from "dotenv";

dotenv.config();

// Configuration for NodeGeocoder
const options = {
  provider: process.env.GEOCODER_PROVIDER || "mapquest",
  httpAdapter: "https",
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null,
};

const geocoder = NodeGeocoder(options);

// Reverse geocoding - coordinates to address
export const getAddressFromCoords = async (lat, lng) => {
  try {
    const res = await geocoder.reverse({ lat, lon: lng });

    if (res.length === 0) {
      throw new Error("No address found for these coordinates");
    }

    // Format the address
    const address = res[0];
    const formattedAddress = `
      ${address.streetNumber || ""} ${address.streetName || ""}, 
      ${address.city || ""}, 
      ${address.state || ""} 
      ${address.zipcode || ""}, 
      ${address.country || ""}
    `
      .replace(/\s+/g, " ")
      .trim();

    return {
      formattedAddress,
      street: address.streetNumber
        ? `${address.streetNumber} ${address.streetName}`
        : null,
      city: address.city,
      state: address.state,
      zipcode: address.zipcode,
      country: address.country,
      countryCode: address.countryCode,
    };
  } catch (err) {
    console.error("Geocoder error:", err);
    throw new Error("Error getting address from coordinates");
  }
};

// Forward geocoding - address to coordinates
export const getCoordsFromAddress = async (address) => {
  try {
    const res = await geocoder.geocode(address);

    if (res.length === 0) {
      throw new Error("No coordinates found for this address");
    }

    return {
      lat: res[0].latitude,
      lng: res[0].longitude,
      formattedAddress: res[0].formattedAddress,
    };
  } catch (err) {
    console.error("Geocoder error:", err);
    throw new Error("Error getting coordinates from address");
  }
};

// Fallback: Use OpenStreetMap Nominatim if primary provider fails
export const getCoordsFromOSM = async (address) => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          limit: 1,
        },
      }
    );

    if (response.data.length === 0) {
      throw new Error("No coordinates found for this address");
    }

    return {
      lat: parseFloat(response.data[0].lat),
      lng: parseFloat(response.data[0].lon),
      displayName: response.data[0].display_name,
    };
  } catch (err) {
    console.error("OSM Geocoder error:", err);
    throw new Error("Error getting coordinates from OSM");
  }
};

export default {
  getAddressFromCoords,
  getCoordsFromAddress,
  getCoordsFromOSM,
};
