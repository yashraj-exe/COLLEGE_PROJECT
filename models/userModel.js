const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    username : {type:String,required:true,trim:true},
    email : {type:String,required:true,trim:true,unique:true},
    phone : {type :Number,required : false},
    password : {type:String,required:true,trim:true},
    balance : {type : Number,required:false,default : 0},
    lastTransaction : [],
    isFreez : {type:Boolean,default : false,required : false},
    join:{type:Date,default:new Date()},
    accountNumber : {type : Number,required : false},
    address : {type : String,required : false},
    loanDetails : {type:Array,required :false}
})

const userModel = mongoose.model('client',userSchema)

module.exports = userModel;