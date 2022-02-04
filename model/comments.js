const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  content: String,
  replies: [],
  username: String,
  userAvatar: String,
});

module.exports = mongoose.model("comment", commentSchema);
