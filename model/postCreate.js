const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postTitle: String,
  postContent: String,
  postBy: String,
  postByPic: String,
  postDate: String,
  postFile: String,
  comments: [],
});

module.exports = mongoose.model("post", postSchema);
