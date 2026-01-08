const jwt = require("jsonwebtoken");

module.exports = (socket, next) => {
  try {
    console.log("🔐 Socket auth data:", socket.handshake.auth);

    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log("❌ No token received");
      return next(new Error("Authentication Error: no token"));
    }

    console.log("🔑 Token received:", token.slice(0, 20) + "...");

    console.log("🧪 JWT_SECRET:", process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;
    console.log("✅ Socket authenticated as:", socket.userId);

    next();
  } catch (err) {
    console.log("❌ JWT verification failed:", err.message);
    next(new Error("Authentication Error"));
  }
};
