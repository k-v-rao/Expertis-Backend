const bcrypt = require("bcryptjs");
const userServices = require("../services/user.services");
const upload = require("../middlewares/upload.js");
const { Auth, LoginCredentials } = require("two-step-auth");
const { remove } = require("../models/user.model");

/**
 * 1. To secure the password, we are using the bcryptjs, It stores the hashed password in the database.
 * 2. In the SignIn API, we are checking whether the assigned and retrieved passwords are the same or not using the bcrypt.compare() method.
 * 3. In the SignIn API, we set the JWT token expiration time. Token will be expired within the defined duration.
 */
exports.updateProfile = (req, res, next) => {

  upload(req, res, function (err) {
    if (err) {
      next(err);
    } else {
      const url = req.protocol + "://" + req.get("host");

      const path =
        req.file != undefined ? req.file.path.replace(/\\/g, "/") : "";

      var model = {
        id: req.body.id,
        name: req.body.name,
        address: req.body.address,
        dob: req.body.dob,
        gender: req.body.gender,
        pic: path != "" ? url + "/" + path : "",
      };

      console.log(model);

      userServices.updateProfile(model, (error, results) => {
        if (error) {
          return next(error);
        }
        return res.status(200).send({
          message: "Success",
          data: results,
        });
      });
    }
  });
};

exports.register = (req, res, next) => {
  const { password } = req.body;

  const salt = bcrypt.genSaltSync(10);

  req.body.password = bcrypt.hashSync(password, salt);

  userServices.register(req.body, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;

  userServices.login({ email, password }, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.userProfile = (req, res, next) => {
  return res.status(401).json({ message: "Authorized User!!" });
};


exports.otpLogin = (req, res, next) => {
  userServices.createNewOTP(req.body, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.verifyOTP = (req, res, next) => {
  userServices.verifyOTP(req.body, (error, results) => {
    if (error) {
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.OTPsend = (req, rev) => {
  LoginCredentials.mailID = "expertisauth@gmail.com";

  // You can store them in your env variables and
  // access them, it will work fine
  LoginCredentials.password = "expertis.in";
  LoginCredentials.use = true;
  async function login(emailId, rev) {
    try {
      const res = await Auth(emailId, "Company Name");
      // console.log(emailId)
      console.log(res);
      console.log(res.mail,"mail");
      console.log(res.OTP,"otp");
      console.log(res.success);
      rev.send({ "status": "sucessful" })
    } catch (error) {
      console.log(error,"error");
    }
  }


  // Pass in the mail ID you need to verify
  login("karthikvrao173@gmail.com", rev);
};
