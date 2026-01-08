const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
    try {
      console.log("REGISTER CONTROLLER HIT");
  
      let { username, email, password } = req.body;
  
      if (!username || !email || !password) {
        return res.status(400).json({ msg: "All fields are required" });
      }
  
      //  sanitize inputs
      username = username.trim();
      email = email.trim().toLowerCase();
  
      //  format username (first letter capital)
      const formatUsername = (name) =>
        name.charAt(0).toUpperCase() + name.slice(1);
  
      username = formatUsername(username);
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ msg: "User already exists" });
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
  
      await User.create({
        username,
        email,
        password: hashPassword,
      });
  
      res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  };
  

const jwt = require("jsonwebtoken");

exports.login = async(req,res)=>{
    try{
        console.log("LOGIN CONTROLLER HIT");
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({msg:"All fields are required"});
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({msg:"Invalid credentials"});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({msg:"Incorrect password"});
        }
        const token = jwt.sign(
            {id:user._id},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );
        res.json({
            token,
            user:{
                _id:user._id,
                username:user.username,
                email:user.email,
            },
        });
    }
    catch (err) {
        console.error("LOGIN ERROR 👉", err);
        res.status(500).json({ msg: "Server error" });
      }
      
}

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (err) {
        console.error("GET ME ERROR 👉", err);
        res.status(500).json({ msg: "Server error" });
    }
};