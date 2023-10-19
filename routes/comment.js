const mongoose = require('mongoose');

const cmtSchema = mongoose.Schema({
    comment: String,
    cmtuser:String,
    cmtlikes:{
        type:Array,
        default:[]
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }
})
  
module.exports = mongoose.model('comment',cmtSchema);

