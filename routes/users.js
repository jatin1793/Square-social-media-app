const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/final');

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
  }]
})

faceSchema.plugin(plm);

module.exports = mongoose.model('user', faceSchema);