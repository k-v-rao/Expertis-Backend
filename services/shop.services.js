const Shop = require("../models/shop.model");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth.js");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const Tags = require("../models/tags.model");

const crypto = require("crypto");
// const key = "verysecretkey"; // Key for cryptograpy. Keep it secret
const nodemailer = require("nodemailer");
const { Services } = require("../models/service.model");

async function create(params, callback) {
  const { owner } = params;
  const { email, phone } = params.contact;
  console.log(email, phone);
  const user = await User.findById(owner).exec();
  if (user == null) {
    return callback({
      message: "Invalid User",
    });
  }
  const shop = new Shop(params);
  shop
    .save()
    .then((response) => {
      //console.log(response._id);
      User.findByIdAndUpdate(
        owner,
        {
          $push: {
            shop: response._id,
          },
        },
        { new: true }
      )
        .then((res) => {
          if (res == null) {
            return callback("Document not found");
          } else {
            // //console.log("res ser", res);
            return callback(null, response);
          }
        })
        .catch((err) => {
          return callback(err);
        });
    })
    .catch((error) => {
      if ("contact.phone" in error.errors) {
        return callback({
          status: 400,
          message: "Shop with phone number already exists",
        });
      }
      if ("shopId" in error.errors) {
        return callback({
          status: 400,
          message: "Shop id already in use",
        });
      }
      return callback(error);
    });
}

async function addservice(params, callback) {
  const { id } = params;
  Services.create({ ...params.service_data, shop: id })
    .then((document) => {
      Shop.findByIdAndUpdate(
        id,
        {
          $push: {
            services: document._id,
          },
        },
        { new: true }
      )
        .then((res) => {
          if (res == null) {
            return callback("Document not found");
          } else {
            //console.log("res ser", res);
            return callback(null, res);
          }
        })
        .catch((err) => {
          return callback(err);
        });
    })
    .catch((e) => {
      //console.log(e);
      return callback(e);
    });
}

async function updateservice(params, callback) {
  const { id } = params;
  Services.findByIdAndUpdate(id, params.service_data, {
    useFindAndModify: true,
    new: true,
  })
    .then((response) => {
      if (!response)
        callback(
          `Cannot update service with id=${id}. Maybe user was not found!`
        );
      else callback(null, response);
    })
    .catch((error) => {
      return callback(error);
    });
}

async function verifyOTP(email, otp, hash, callback) {
  // Separate Hash value and expires from the hash returned from the user
  let [hashValue, expires] = hash.split(".");
  // Check if expiry time has passed
  let now = Date.now();
  if (now > parseInt(expires)) return callback("OTP Expired");
  // Calculate new hash with the same key and the same algorithm
  let data = `${email}.${otp}.${expires}`;
  let newCalculatedHash = crypto
    .createHmac("sha256", key)
    .update(data)
    .digest("hex");
  // Match the hashes

  if (newCalculatedHash === hashValue) {
    //console.log("matched");
    let doc = await Shop.findOneAndUpdate({ email }, { verified: true });
    //console.log(doc);
    if (!doc)
      callback(
        `Cannot update Profile with id=${email}. Maybe user was not found!`
      );
    else {
      const token = auth.generateAccessToken(email);
      return callback(null, { ...doc.toJSON(), token });
    }
  } else {
    return callback("Invalid OTP");
  }
}

async function getShopById(shopId, callback) {
  console.log(shopId);
  Shop.findById(shopId)
    .populate("services")
    .then((response) => {
      if (!response) callback("Not found Shop with id " + shopId);
      else callback(null, response);
    })
    .catch((error) => {
      return callback(error);
    });
}

async function updateShop(params, callback) {
  const shopId = params.shopId;

  Shop.findByIdAndUpdate(shopId, params, { useFindAndModify: false, new: true })
    .then((response) => {
      if (!response)
        callback(
          `Cannot update Shop with id=${shopId}. Maybe Tutorial was not found!`
        );
      else callback(null, response);
    })
    .catch((error) => {
      return callback(error);
    });
}

async function deleteShop(params, callback) {
  const shopId = params.shopId;

  Shop.findByIdAndRemove(shopId)
    .then((response) => {
      if (!response)
        callback(
          `Cannot delete Shop with id=${shopId}. Maybe Product was not found!`
        );
      else callback(null, response);
    })
    .catch((error) => {
      return callback(error);
    });
}

async function getShops(req, callback) {
  try {
    let query;
    const pinCode = req.query.pinCode;
    let city = req.query.city;
    // console.log(pinCode, city);
    let pattern = [];
    if (pinCode !== undefined && pinCode !== null) {
      pattern.push({ "contact.pinCode": pinCode });
    }
    if (city !== undefined && city !== null) {
      city = new RegExp(city, "i");
      pattern.push({ "contact.address": city });
    }
    if (pattern.length > 0) {
      query = { $or: pattern };
    }
    // console.log(pattern);

    const shops = await Shop.find(query)
      .sort({ "rating.totalMembers": -1, "rating.avg": -1 })
      .limit(10)
      .populate("services");

    return callback(null, shops);
  } catch (e) {
    return callback(e);
  }
}

module.exports = {
  create,
  updateservice,
  verifyOTP,
  addservice,
  getShopById,
  updateShop,
  deleteShop,
  getShops,
};
