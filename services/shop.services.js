const Shop = require("../models/shop.model");
const ShopAnalytics = require("../models/subModels/shopAnalytics.model");
const User = require("../models/user.model");
const Reviews = require("../models/review.model");
const Appointments = require("../models/appointment.model");
const auth = require("../middleware/auth.js");
const Tags = require("../models/tags.model");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Services } = require("../models/service.model");
const SlotBooking = require("../models/slotsBooking.model");
const { query } = require("express");
var ObjectId = require("mongoose").Types.ObjectId;

async function createShop(params, callback) {
  try  {
      const { owner } = params;
      const { email, phone } = params.contact;
      console.log(email, phone);
      const user = await User.findById(owner).exec();
      if (user == null) {
        return callback({
          status: 400,
          message: "Invalid User",
        });
      }

    member = {
      member: user._id,
      role: "owner",
      name: user.name,
      pic: user.userPic,
    };
    params.members = [member];
    console.log(params);
    const shop = new Shop(params);
    shop
      .save()
      .then((response) => {
        //console.log(response._id);
        User.findByIdAndUpdate(
          owner,
          {
            $set: {
              "roles.isShopOwner": true,
              "roles.isShopMember": true,
            },
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
  } catch (error) {
    return callback(error);
  }
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

async function addShopView(req, callback) {
  ShopAnalytics.findOneAndUpdate(
    { shop: req.params.id },
    {
      $push: {
        views: {
          from: req.user.id,
        },
      },
    },
    { new: true }
  )

    .then((response) => {
      if (!response) {
        ShopAnalytics.create({
          shop: req.params.id,
          views: {
            from: req.user.id,
          },
        })
          .then(async (response) => {
            let updatedShop = await Shop.findByIdAndUpdate(req.params.id, {
              analytics: response._id,
            });
            console.log(updatedShop);
            callback(null, response);
          })
          .catch((error) => {
            return callback(error);
          });
      } else {
        callback(null, response);
      }
    })
    .catch((error) => {
      return callback(error);
    });
}

async function getShopAnalyticsById(req, callback) {
  ShopAnalytics.findOne({ shop: req.params.id })
    .then((response) => {
      if (!response) callback("Not found Shop with id " + req.params.id);
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
async function getShopByShopId(shopId, callback) {
  let pattern = [];
  let query;
  if (shopId !== undefined && shopId !== null) {
    pattern.push({ shopId: shopId });
  }
  if (ObjectId.isValid(shopId)) {
    pattern.push({ _id: ObjectId(shopId) });
  }
  if (pattern.length > 0) {
    query = { $or: pattern };
  }

  console.log(shopId);
  Shop.findOne(query)
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
  const shopId = params.id;

  // WARNING: Contact will be completely replace

  Shop.findByIdAndUpdate(shopId, params, { useFindAndModify: false, new: true })
    .populate("services")
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

async function deleteShop(req, callback) {
  const id = req.params.id;
  // console.log(id, "its a shop id")
  let shop = await Shop.findById(id).exec();

  if (!shop) {
    return callback({
      status: 400,
      message: "Shop id not exits",
    });
  }
  if (req.user.id != shop.owner) {
    if (!req.user.isAdmin)
      return callback(
        {
          status: 401,
          message: `Cannot delete Shop you are not authgorizes`,
        }
      );
  }
  //delete the shop services
  await Services.deleteMany({ shop: id }).then(console.log("delete the services")).catch(e => { return callback(e) })
  //delete the shop reviews
  await Reviews.deleteMany({ to: id }).then(console.log("delete the shop review")).catch(e => { return callback(e) })
  //delete the shop appointments
  await Appointments.deleteMany({ shopId: id }).then(console.log("delete the appointments of the shop")).catch(e => { return callback(e) })
  //delete the shop SlotBooking
  await SlotBooking.deleteMany({ shopId: id }).then(console.log("delete the slot bookings of the shop")).catch(e => { return callback(e) })
  //delete the shop
  Shop.findByIdAndRemove(id)
    .then((response) => {
      if (!response)
        return callback(
          `Cannot delete Shop with id=${id}. Maybe Product was not found!`
        );
    })
    .catch((error) => {
      return callback(error);
    });
  //delete the shop refference in user
  let updatedUser = await User.findByIdAndUpdate(shop.owner, {
    $pull: { shop: id },
  });
  return callback(null, updatedUser);
}

async function deleteService(id, callback) {
 

  Services.findByIdAndRemove(id)
    .then(async (response) => {
      if (!response)
        callback(
          `Cannot delete Service with id=${id}. Maybe Service was not found!`
        );
      else {
        let updatedShop = await Shop.findByIdAndUpdate(response.shop, {
          $pull: { services: id },
        }, { new: true });
        console.log(updatedShop);

        callback(null, updatedShop);
      }
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

function getSlot(query, callback) {
  SlotBooking.findOne(query)
    .then((response) => {
      if (!response) callback(null, []);
      else callback(null, response);
    })
    .catch((error) => {
      return callback(error);
    });
}

async function getServices(id, callback) {
  try{
    let shop = await Shop.findById(id).populate("services");
    console.log(shop);
    if (!shop) return callback({ message: "Shop not found", status: 404 });
  
    return callback(null, shop.services);
  } catch (e) {
    return callback(e);
  }
}

module.exports = {
  createShop,
  updateservice,
  addShopView,
  getShopAnalyticsById,
  verifyOTP,
  addservice,
  deleteService,
  getShopById,
  getShopByShopId,
  updateShop,
  deleteShop,
  getShops,
  getSlot,
  getServices,
};
