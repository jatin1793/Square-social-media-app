const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    caption: String,
    location: String,
    imageurl: String,
    user: String,
    likes: {
        type: Array,
        default: []
    },
    comment: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment"
      }],
    author: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }]
})

module.exports = mongoose.model('post', postSchema);
