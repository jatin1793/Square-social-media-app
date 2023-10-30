const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URL);

const faceSchema = mongoose.Schema({
  name: String,
  username: String,
  mobilenumber: Number,
  password: String,
  email: String,
  secret: String,
  expiry:{
    type:String
  },
  image:[{
    type:String,
    default:"../uploads/image.jpg"
  }],
  profilepic:{
    type:String,
    default:"../uploads/image.jpg"

  },
  post: [{
    type: mongoose.Schema.Types.ObjectId,
    default: [],
    ref: "post"
  }],
  followings: [{
    type: mongoose.Schema.Types.ObjectId,
    default: [],
    ref: "user"
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    default: [],
    ref: "user"
  }],
})

faceSchema.plugin(plm);

module.exports = mongoose.model('user', faceSchema);