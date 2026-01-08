
const express = require("express");
const {register,login,getMe} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router  = express.Router();

router.post("/register",register);
  
router.post("/login",login);

router.get("/me", authMiddleware, getMe);

module.exports = router;

// user 1
// 69499f9331fc8e0c6cc65706
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDk5ZjkzMzFmYzhlMGM2Y2M2NTcwNiIsImlhdCI6MTc2NjUxMzk3MCwiZXhwIjoxNzY2NjAwMzcwfQ.Kf2TuJ5CG8BgX6dzeefS61GMGGoymucgsSRSp5-5bAo

// user 2
// 694ae35c9e68538601ce3bc9
// 694ae35c9e68538601ce3bc9
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGFlMzVjOWU2ODUzODYwMWNlM2JjOSIsImlhdCI6MTc2NjUxNTc2MSwiZXhwIjoxNzY2NjAyMTYxfQ.b0g8jyIIhwWR5jvcVctCcmxw3VrKt_8wEKG6KVQvprY



// sendMessage("694ae35c9e68538601ce3bc9", "Test status");
