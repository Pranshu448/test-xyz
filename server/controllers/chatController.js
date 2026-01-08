const socket = require("../server/socket");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const mongoose = require("mongoose");

exports.createChat = async (req, res) => {
    try {
      const userId = req.user; // logged-in user
      const { otherUserId } = req.body;
  
      if (!otherUserId) {
        return res.status(400).json({ message: "otherUserId required" });
      }
  
      // 1️⃣ Check if chat already exists
      let chat = await Chat.findOne({
        participants: { $all: [userId, otherUserId], $size: 2 },
      });
  
      // 2️⃣ If not, create new chat
      if (!chat) {
        chat = await Chat.create({
          participants: [userId, otherUserId],
          unreadCount: {},
        });
      }
  
      res.json(chat);
    } catch (err) {
      console.error("createChat error:", err);
      res.status(500).json({ message: err.message });
    }
  };
  
exports.getMyChats = async (req, res) => {
    try {
      console.log("REQ.USER =", req.user);
  
      const userId = new mongoose.Types.ObjectId(req.user);
  
      const chats = await Chat.find({
        participants: { $elemMatch: { $eq: userId } },
      })
        .populate("participants", "username email isOnline")
        .populate({
          path: "lastMessage",
          populate: { path: "sender", select: "username" },
        })
        .sort({ updatedAt: -1 });
  
      console.log("🔥 chats found:", chats.length);
      res.json(chats);
    } catch (err) {
      console.error("getMyChats error:", err);
      res.status(500).json({ message: err.message });
    }
  };  
exports.markChatAsRead = async (req, res) => {
    try {
      const userId = req.user;           // string
      const { chatId } = req.params;
      const io = socket.getIO();
  
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
  
      /* ------------------------------
         RESET UNREAD COUNT
      -------------------------------*/
      // ✅ Ensure userId is string for Map key consistency
      const userIdStr = String(userId);
      chat.unreadCount.set(userIdStr, 0);
      
      // ✅ CRITICAL: Mark Map as modified for Mongoose to persist changes
      chat.markModified('unreadCount');
      
      await chat.save();

      console.log("📤 Emitting chat_read", {
        chatId,
        readerId: userId,
      });
      

      chat.participants.forEach((participantId) => {
        if (participantId.toString() !== userId) {
          io.to(participantId.toString()).emit("chat_read", {
            chatId,
            readerId: userId,
          });
        }
      });

  
      /* ------------------------------
         MARK MESSAGES AS READ
         (messages NOT sent by me)
      -------------------------------*/
      const messagesToMarkRead = await Message.find({
        chat: chatId,
        sender: { $ne: userId },
        status: { $ne: "read" },
      });
  
      await Message.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          status: { $ne: "read" },
        },
        { status: "read" }
      );
  
      /* ------------------------------
         NOTIFY SENDERS
      -------------------------------*/
  
      messagesToMarkRead.forEach((msg) => {
        io.to(msg.sender.toString()).emit("message_status_update", {
          messageId: msg._id,
          status: "read",
        });
      });

  
      res.json({ success: true });
    } catch (err) {
      console.error("❌ markChatAsRead error:", err);
      res.status(500).json({ message: err.message });
    }
  };
