const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  members: {
    type: Number,
  },
  image: {
    type: String,
  },
});

module.exports = mongoose.model("community", communitySchema);
