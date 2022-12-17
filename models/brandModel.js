const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    images: [{
        url: String,
        filename: String
    }],
    deleteStatus:{
        type:Boolean,
        default:false
    }

}, {timestamps:true});

module.exports = mongoose.model('Brand',brandSchema);