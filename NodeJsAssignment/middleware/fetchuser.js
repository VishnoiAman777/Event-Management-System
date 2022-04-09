// This is the middleware i have used in order to
// authenticate wheather the jwt token has been sent by the user or not in req.header

const jwt = require("jsonwebtoken");
require('dotenv').config()
const JWT_TOKEN = process.env.JWT;


const fetchuser = (req, res, next)=>{
    // Get the user from the jwt token and add id to req object
    const token = req.header('auth-token');
    if (!token){
        res.status(401).send({error:"Please authenticate via valid token"});
    }

    try {
        const string = jwt.verify(token, JWT_TOKEN);
        req.user = string.user;
        next();
    } catch (error) {
        res.status(401).send({error:"Please authenticate via token"});
    }

    
}

module.exports = fetchuser;