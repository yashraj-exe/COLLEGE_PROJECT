const mongoose = require("mongoose");

const loanSchema = mongoose.Schema({
    accountNumber : {type : String,required : true},
    username : {type : String, required : false},
    email : {type : String, required : false},
    phone : {type : String, required : false},
    loanType : {type : String, required : false},
    emi : {type : Array, required : false},
    currentBalance : {type : String, required : false},
    loanIssueDate : {type : String, required : false},
    loanIssueTill : {type : String, required : false},
    reason : {type : String,required:false},
    loanID : {type : String,required :false},
    loanAmmount : {type : String,required : true},
    loanYears : {type : String, required : true},
    status : {type : String , required : false},
    totalPanelty : {type : Number,required : false,default : 0}
});

let loanModel = mongoose.model('loan',loanSchema);

module.exports = loanModel;
