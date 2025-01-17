import jwt from "jsonwebtoken";

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Get token from header

  if (!token) {
    return res
      .status(403)
      .json({ status: false, message: "No token provided" });
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized: Invalid token" });
    }

    req.user = decoded; // Store decoded user information in the request object
    next();
  });
};

export default verifyToken;
