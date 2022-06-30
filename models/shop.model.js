const mongoose = require("mongoose");
const { Schema } = mongoose;
const uniqueValidator = require("mongoose-unique-validator");
const jwt = require("jsonwebtoken");

const ShopSchema = new Schema(
  {
    owner: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    shopName: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,

      required: [true, "Phone number is required"],
    },
    address: {
      type: String,
      required: false,
    },
    pinCode: {
      type: Number,
      required: false,
      min: [6, "Minimum 6 digit Pin Code"],
      max: [6, "Maximum 6 digit Pin Code"],
    },
    shopLogo: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
    verified: {
      type: Boolean,
      required: false,
      default: false,
    },
    isVerifiedByAdmin: {
      type: Boolean,
      required: false,
      default: false,
    },
    gallery: {
      type: [String],
      required: false,
    },
    location: {
      type: String,
      required: false,
    },
    services: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Service",
        },
      ],
      required: false,
    },

    tags: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Tags",
        },
      ],
      required: false,
    },
    slotsBooked: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "SlotBooking",
          
        },
      ],
      
    },
    appointments: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Appointment",
        },
      ],
    },
  },
  { timestamps: true }
);

ShopSchema.methods.generateVerificationToken = function () {
  const shop = this;
  console.log("shop ", shop._id);
  console.log(
    "process.env.USER_VERIFICATION_TOKEN_SECRET ",
    process.env.USER_VERIFICATION_TOKEN_SECRET
  );
  const verificationToken = jwt.sign(
    { ID: shop._id },
    process.env.USER_VERIFICATION_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return verificationToken;
};

/**
 *  Here we are creating and setting an id property and 
    removing _id, __v, and the password hash which we do not need 
    to send back to the client.
 */
ShopSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    //do not reveal passwordHash
    delete returnedObject.password;
  },
});

/**
 * 1. The userSchema.plugin(uniqueValidator) method won’t let duplicate email id to be stored in the database.
 * 2. The unique: true property in email schema does the internal optimization to enhance the performance.
 */
ShopSchema.plugin(uniqueValidator, { message: "Email already in use." });

const Shop = mongoose.model("Shop", ShopSchema);
module.exports = Shop;
