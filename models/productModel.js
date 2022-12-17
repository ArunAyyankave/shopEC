const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    images: [{
        url: String,
        filename: String
    }],
    price:{
        type:String,
        required:true
    },
    stock:{
        type:Number,
        
    },
    deleted:{
        type:Boolean,
        default:false
    }

}, {timestamps:true});

module.exports = mongoose.model('Product',productSchema);