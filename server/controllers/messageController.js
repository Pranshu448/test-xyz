const Message = require("../models/Message");
const mongoose = require("mongoose");

exports.sendMessage = async (req, res) => {
    try {
      const senderId = req.user;
      const { chatId, content } = req.body;
  
      if (!chatId || !content) {
        return res.status(400).json({ msg: "All fields are required" });
      }
  
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ msg: "Invalid chatId" });
      }
  
      const message = await Message.create({
        chat: chatId,
        sender: senderId,
        content,
        status: "sent",
      });
  
      res.status(201).json(message);
    } catch (err) {
      console.error("MESSAGE ERROR:", err);
      res.status(500).json({ msg: "Server error" });
    }
  };
  
exports.getMessagesByChat = async (req, res) => {
    try {
      const { chatId } = req.params;
  
      const messages = await Message.find({ chat: chatId })
        .sort({ createdAt: 1 })
        .populate("sender", "username");
  
      res.json(messages);
    } catch (err) {
      res.status(500).json({ msg: "Server error" });
    }
  };