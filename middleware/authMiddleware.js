import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protect = async (req, res, next) => {
  let token;

  // 1. Get the token from the request
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // 2. Verify the token
      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      // 3. Get user from the token and attach to request
      req.user = await User.findById(decoded.id).select("-userPassword");
      //   console.log("req", req.user);
      //   console.log("decod", decoded);

      next();
    } catch (error) {
      console.error("Error in token verification:", error);
      res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    res.status(401).json({
      message: "Not authorized, no token",
    });
  }
};

// Optional: Admin role middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      message: "Not authorized as an admin",
    });
  }
};

export { protect, admin };
