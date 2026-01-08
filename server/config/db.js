const mongoose = require("mongoose");

async function connectDB() {
  await mongoose.connect("mongodb://127.0.0.1:27017/chat");
  console.log("🔥 Connected to DB:", mongoose.connection.name);

  console.log("MongoDB connected");
}

module.exports = connectDB;
