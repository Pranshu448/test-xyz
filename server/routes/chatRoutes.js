const express = require("express");
const router = express.Router();
const { getMyChats } = require("../controllers/chatController");
const auth = require("../middleware/authMiddleware");
const { markChatAsRead,createChat } = require("../controllers/chatController");

router.get("/my-chats", auth, getMyChats);

router.post("/read/:chatId",auth,markChatAsRead);

router.post("/create", auth, createChat);


module.exports = router;
