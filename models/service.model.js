const mongoose = require("mongoose");
const { Schema } = mongoose;

const ServiceSchema = new Schema({
  serviceName: {
    type: String,
  },
  price: {
    type: Number,
  },
  photo: {
    type: String,
    required: false,
  },
  time: {
    type: String,
  },
  description: {
    type: String,
    required: false,
  },
  isVerifiedByAdmin: {
    type: String,
    required: false,
    default: false,
  },
  shop: {
    type: Schema.Types.ObjectId,
    ref: "Shop",
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
});
ServiceSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});
const Services = mongoose.model("Service", ServiceSchema);
module.exports = { Services, ServiceSchema };
