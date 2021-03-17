const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const profileSchema = new Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  classroom: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
  },
},  {timestamps: true});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;
