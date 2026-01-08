const jwt = require("jsonwebtoken");

module.exports = async (req,res,next)=>{
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "No token, access denied" });
      }

    const token = authHeader.split(" ")[1];

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded.id;
        next();
    }
    catch(err){
        res.status(401).json({msg:"Invalid Token"});
    }
}

