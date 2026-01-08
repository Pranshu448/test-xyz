const express = require("express");

const {sendMessage,getMessagesByChat} = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/",authMiddleware,sendMessage);

router.get("/chat/:chatId", authMiddleware, getMessagesByChat);

module.exports = router;