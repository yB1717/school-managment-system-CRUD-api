const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const schoolSchema = new Schema(
  {
    public_id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Schools = mongoose.model("School", schoolSchema);

module.exports = Schools;
