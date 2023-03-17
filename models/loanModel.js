const mongoose = require("mongoose");

const loanSchema = mongoose.Schema({
    username : {type : String, required : false},
    email : {type : String, required : false},
    phone : {type : String, required : false},
    loanType : {type : String, required : false},
    emi : {type : Array, required : false},
    currentBalance : {type : String, required : false},
    loanIssueDate : {type : String, required : false},
    loanIssueTill : {type : String, required : false}
});

let loanModel = mongoose.model('loan',loanSchema);

module.exports = loanModel;
