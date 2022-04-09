// Adding the required imports
// Adding express-router, user model for registering the users, express-validator for validating the input from user bcrypt for hasing and salting the passwords,
// json-web-token for validating the user
const express = require("express");
const router = express.Router();
const User = require("../Models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

require('dotenv').config()
const JWT_TOKEN = process.env.JWT;

// Route1 : Create a user using: POST "/api/auth/createuser".Doesn't require auth
router.post(
  "/createuser",
  [
    body("email", "Enter a valid email").isEmail(),
    body("name", "Enter a valid Name").isLength({ min: 3 }),
    body("password", "Please enter a password of min 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check wheather the email exists already if already exists deny the register part
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res.status(400).json({ error: "Sorry the email exists" });
      } else {
        // Bcrypt for hashing and salting the password
        sec_password = await bcrypt.hash(req.body.password, saltRounds);

        user = await User.create({
          name: req.body.name,
          email: req.body.email,
          password: sec_password,
        });

        const data = {
          user: {
            id: user.id,
          },
        };

        const authToken = jwt.sign(data, JWT_TOKEN);
        // I am setting up a cookie in browser the time user is registering.
        res.cookie('user', authToken);
        res.json({ authToken: authToken });
      }
    } catch (error) {
      // This are the errors just to handle any anomaly in the database i.e. maybe the database is not running or may be it is not working properly
      console.log(error.message);
      res.status(500).send("Some Error Occured Please Try again");
    }
  }
);

// Route2 : Authenticate a user /login
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password Can't be blank'").exists(),
  ],
  async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success,error: "Incorrect Crediantials Email is invalid" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ success, error: "Incorrect Crediantials Password is invalid" });
      }

      const data = {
        user: {
          id: user.id,
        },
      };
      success=true;
      const authToken = jwt.sign(data, JWT_TOKEN);
      // I am setting up a cookie in browser at the time user is looging in so that he don't have to login in over and over. Cookie expire date can be set easily.
      res.cookie('user', authToken);
      // Not in the get request if the cookie is present don't render the login page instead just render the home screen
      res.json({success, authToken: authToken });
    } catch (error) {
      // This are the errors just to handle any anomaly in the database i.e. maybe the database is not running or may be it is not working properly
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Route 3: User can logout of the system. In order to logout the use must need to login and in login I have set the jwt token. 
router.get(
  "/logout",fetchuser,
  async (req, res) => {
    try {
      res.clearCookie('user');
      res.send("Logout Successfull");
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error.Please try again later");
    }
  }
);


// Route 4: Change the password of profile /api/auth/changePassword
router.post(
  "/changePassword",
  [
    body("email", "Enter a valid email").isEmail(),
    body("oldpassword", "Enter a valid old password").isLength({ min: 5 }),
    body("newpassword", "Please enter a new password of min 5 characters").isLength({ min: 5 })
  ],
  async (req, res) => {

    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }
    try {
      let email = req.body.email;
      let password = req.body.oldpassword;
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success,error: "Incorrect Crediantials Email is invalid" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ success, error: "Incorrect Crediantials Password is invalid" });
      }
      let newpass = req.body.newpassword;
      let sec_password = await bcrypt.hash(newpass, saltRounds);
      user.password = sec_password;
      await user.save();
      success = true;
      res.json({success, info:"Password have been changed successfully"});
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error. Please try again later. Maybe that is because of server down");
    }
  }
);

// Route 5: To update the password in case of resetting it.

router.post(
  "/updatePassword",
  [
    body("email", "Enter a valid email").isEmail(),
    body("otp", "Enter an otp of six digits").isLength(6),
    body("newpassword", "Please enter a new password of min 5 characters").isLength({ min: 5 })
  ],
  async (req, res) => {

    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }
    // In the route 6 I have already told that the otp is is 6 digits that can be applied when we know about the how the password is resetted
    const otp = req.body.otp;
    const newpassword = req.body.newpassword;
    const email = req.body.email;
    const user = await User.findOne({email});
    if (!user){
      res.status(400).json({errors:"You must have wrongly typed the email address"})
    }
    if (otp == '123456'){
      let sec_password = await bcrypt.hash(newpassword, saltRounds);
      user.password = sec_password;
      user.save();
      res.status(200).json({success:true, info:"Password has been chaged successfully"});
    }
    else{
      res.status(401).json({errors:"Unauthorized user"});
    }

  } 
)

// Route 6: To send the information required to reset the password in case you forget it

router.post(
  "/resetPassword",
  [
    body("email", "Enter a valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array() });
    }
    let email = req.body.email;
    const user = await User.findOne({email});
    if (!user){
      res.status(400).json({errors:"No such email exists in our database"});
    }
    else{
      // Now here a function should be called that will send some otp to verify that the actual user is trying to reset is password. We could store the opt in temp collection until it has been verified.
      // But for now since we don't know the actual way to getting password resetted let's ignore it and keep it 123456.
        res.status(401).json({info:'reset password otp has been successfully sent to your email/phone. For now consider otp = 123456'})
    }
    
  } 
)

module.exports = router;
