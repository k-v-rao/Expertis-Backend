const usersController = require("../controllers/user.controller");

const express = require("express");
const router = express.Router();

router.post("/register", usersController.register);
router.post("/login", usersController.login);
router.get("/verify/:token", usersController.verify);
router.post("/update-Profile/:id", usersController.updateProfile);
router.get("/user-Profile", usersController.userProfile);
router.post("/send_otp", usersController.send_otp);
router.post("/verify_otp", usersController.verify_otp);
router.post("/new_password", usersController.new_password);
router.post("/reset_password", usersController.reset_password);


module.exports = router;
