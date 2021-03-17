const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    scopes: [String],
  },
  { timestamps: true }
);

const Roles = mongoose.model('Role', roleSchema);

module.exports = Roles;
