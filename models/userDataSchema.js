const mongoose = require('mongoose');
const schema = mongoose.Schema;

const userSchema = new schema({
    AWSUserName:{
        type: String,
        required: true
    },
    SmartcarAccessToken:{
        type:String,
        required: true
    },
    SmartcarAccessTokenExpiry:{
        type: String,
        required: true
    },
    vehicleID:{
        type: String,
        required: true
    },
    vehicleMake:{
        type:String,
        required: true
    },
    vehicleModel:{
        type: String,
        required: true
    },
    vehicleYear:{
        type: String,
        required: true
    }

}, {timestamps:true})

const Code = mongoose.model('Code', userSchema)

module.exports = Code;