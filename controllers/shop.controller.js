const shopServices = require("../services/shop.services");
const bcrypt = require("bcryptjs");
const upload = require("../middlewares/upload.js");

exports.register = (req, res, next) => {
  const { password } = req.body;

  const salt = bcrypt.genSaltSync(10);

  req.body.password = bcrypt.hashSync(password, salt);

  shopServices.register(req.body, (error, results) => {
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

  shopServices.login({ email, password }, (error, results) => {
    if (error.code == 302) {
      return res.status(302).send({
        message: "verify your account",
        data: error,
      });
    }

    if (error) {
      console.log(error)
      return next(error);

    }

    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};

exports.verify_otp = (req, res, next) => {

  const email = req.body.email;
  const otp = req.body.otp;
  const hash = req.body.hash
  shopServices.verifyOTP(email, otp, hash, (error, results) => {
    if (error) {
      console.log(error)
      return next(error);
    }
    return res.status(200).send({
      message: "Success",
      data: results,
    });
  });
};