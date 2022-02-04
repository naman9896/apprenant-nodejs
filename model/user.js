const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  googleId: {
    type: String,
  },

  githubId: {
    type: String,
  },

  provider: {
    type: String,
    required: true,
  },

  thumbnail: {
    type: String,
  },

  about: {
    type: String,
  },

  firstName: {
    type: String,
  },

  lastName: {
    type: String,
  },

  DOB: {
    type: String,
  },
});

module.exports = mongoose.model("user", userSchema);
