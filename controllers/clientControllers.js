const dotenv = require('dotenv').config()
const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const randomize = require('randomatic');
const moment = require('moment')
const Excel = require('exceljs')
const path = require('path')
let date = new Date();

class clientControllers {
    static login = async (req, res) => {  // active
        const { email, password } = req.body;
        if(email && password){
            try {
                const data = await userModel.findOne({ email: email });
                if (data != null) {
                    const isMatch = await bcrypt.compare(password, data.password);
                    if ((email === data.email) && isMatch) {
                        //JWT/

                        const token = jwt.sign({ userID: data._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' })
                        // console.log(data.username)
                        res.send({ status: "SUCCESS", message: "Login Success", "Token": token,name : data.username})
                    } else {
                        res.send({ status: "FAILED", message: "email and password are invalid" })
                    }
                } else {
                    res.send('not a register user')
                }
            } catch (error) {
                console.log(process.env.JWT_SECRET_KEY)
                res.send({ status: "Failed", message: "unable to login user", err: error.message })
            }
        }else{
            res.send("Error all fields are required")
        }
        
    }
    static changePassword = async (req, res) => {
        const { current_password, confirm_password, new_password} = req.body;
        if (current_password && confirm_password) {
            if (current_password !== confirm_password) {
                res.send({ status: "Failed", message: "password dosen't Match" })
            } else {
                const user = await userModel.findOne({ _id: req.id });
                const isMatch = await bcrypt.compare(current_password, user.password);
                const salt = await  bcrypt.genSalt(10);
                // let new_password = randomize('0A',5);
                const newHashPassword = await bcrypt.hash(new_password,salt);
                if (isMatch) {
                    let response = await userModel.findByIdAndUpdate(req.id,{$set:{password:newHashPassword}});
                    console.log(response)
                    res.send({ status: "Success", message: "Successfully change password",newPassword : new_password})
                } else {
                    res.send({ status: "Failed", message: "password password is incorrect" })
                }
            } 
        } else {
            res.send({ status: "Failed", message: "All fields are required" })
        }
    }
    static checkBalance = async (req,res)=>{ // active
        try {
            let user = await userModel.findOne({'_id':req.id},{balance : 1,_id : 0});
            res.send({status : "SUCCESS",code : 200, balance : user.balance.toFixed(2)});
        } catch (error) {
            res.send({status : "FAILED",code : 200, message : "Errror cannot check balance something went wrong"});
        }
    }
    static depositAmount = async (req,res)=>{ // active
        
        let {depositeAmount,password} = req.body;
        try {
            let user = await userModel.findOne({'_id':req.id});
            if(user){
                if(user.isFreez != true){
                    if(depositeAmount >=1 ){
                        const isMatch = await bcrypt.compare(password, user.password);
                        if(isMatch){
                            let finalBalance = user.balance + depositeAmount;
                            await userModel.updateOne({'_id':req.id},{$set : {balance : finalBalance}})
                            let tempArray = user.lastTransaction;
                            let tranObj = {
                                type : "DEPOSITE",
                                date : moment(new Date()).format("MMMM Do YYYY, h:mm:ss a"),
                                debit : 0,
                                credit : depositeAmount,
                                balance : user.balance + depositeAmount,
                                to : "self"
                            }
                            tempArray.unshift(tranObj);
                            await userModel.updateOne({'_id':req.id},{$set:{lastTransaction : tempArray }})
                            res.send({message : "Balance Deposite Successfully",status:"SUCCESS"});
                        }else{
                
                            res.send({message : "Incorrect Password",status:"FAILED"});
                        }
                    }else{
                        res.send({message : "Error enter valid Amount",status:"FAILED"});
                    }
                }else{
                    res.send({message : "Error Sorry your account is Freez kindly contact Admin",status:"FAILED"});
                }
            }else res.send({message : "Error Something went wrong",status:"FAILED"}); 
        } catch (error) {
            console.log("ERRROR 01",error)
            res.send("ERROR 404")
            
        }
    }
    static withdrawAmount = async (req,res)=>{ // active
        let {withdrawAmount,password} = req.body;
        try {
            let user = await userModel.findOne({'_id':req.id});
            if(user){
                if(user.isFreez != true){
                    const isMatch = await bcrypt.compare(password,user.password);
                    console.log(isMatch)
                    if(isMatch){
                        if(withdrawAmount <= user.balance){
                            if(withdrawAmount >= 0.1){
                                let finalAmount = user.balance - withdrawAmount;
                                await userModel.updateOne({'_id':req.id},{$set:{balance : finalAmount.toFixed(2)}});
                                let tempArray = user.lastTransaction;
                                let tranObj = {
                                    type : "WITHDRAW",
                                    date : moment(new Date()).format("MMMM Do YYYY, h:mm:ss a"),
                                    debit : withdrawAmount,
                                    credit : 0,
                                    balance : user.balance - withdrawAmount,
                                    to : "self"
                                }
                                tempArray.unshift(tranObj);
                                await userModel.updateOne({'_id':req.id},{$set:{lastTransaction : tempArray }})
                                res.send({message:"Amount withdraw successfully",status:"SUCCESS"});
                            }else{
                                res.send({message:"Enter valid ammount",status:"FAILED"});
                            }
                        }else{
                            res.send({message:"Insufficient funds",status:"FAILED"});
                        }
                        
                    }else res.send({message:"Password is Incorrect",status:"FAILED"});
                }else{
                    res.send({message:"Sorry your account is Freez kindly contact Admin",status:"FAILED"});
                }
            }else{
                res.send({message:"Error Something went wrong",status:"FAILED"});
            }
        } catch (error) {
            console.log(error)
            res.send("Error cannot not Deposite Amount");
        }
    }
    static transferAmount = async (req,res)=>{ // active
        let {amount,account} = req.body;
        try {
            let currentUser = await userModel.findOne({'_id':req.id});
            let receiverUser = await userModel.findOne({'accountNumber':account});
            if(currentUser){
                if(currentUser.isFreez != true){
                    if(currentUser.balance >= amount){
                    	if(receiverUser){
                            let finalAmount = receiverUser.balance + amount;
                            await userModel.updateOne({'accountNumber':account},{$set:{balance : finalAmount}});
                            await userModel.updateOne({'_id':req.id},{$set:{balance : currentUser.balance - amount}})
                            let tempArray = currentUser.lastTransaction;
                                let tranObj = {
                                    type : "TRANSFER",
                                    date : moment(new Date()).format("MMMM Do YYYY, h:mm:ss a"),
                                    debit : amount,
                                    credit : 0,
                                    balance : currentUser.balance - amount,
                                    to : account
                                }
                                tempArray.unshift(tranObj);
                                await userModel.updateOne({'_id':req.id},{$set:{lastTransaction : tempArray }})
                                let tempArray2 = receiverUser.lastTransaction;
                                let tranObj2 = {
                                    type : "WITHDRAW",
                                    date : moment(new Date()).format("MMMM Do YYYY, h:mm:ss a"),
                                    debit : 0,
                                    credit : amount,
                                    balance : receiverUser.balance + amount,
                                    to : account
                                }
                                tempArray2.unshift(tranObj2);
                                await userModel.updateOne({accountNumber : account},{$set:{lastTransaction : tempArray2 }})
                            res.send({message : "Successfully Transfer ammount", status : "SUCCESS"});
                        }else{
                            res.send({message : "Receiver account not found", status : "FAILED"});
                        }
                    }else{
                        res.send({message : "Insufficient funds", status : "FAILED"});
                    }
                }else{
                    res.send({message : "Error Sorry your account is Freez kindly contact Admin", status : "FAILED"});
                }
            }else{
                res.send({message : "Something went wrong", status : "FAILED"});
            }
        } catch (error) {
            console.log(error)
            res.send("Error cannot transfer amount");
        }
    }
    static accountNumber = async (req,res)=>{ // active
        try {
            let user = await userModel.findOne({'_id':req.id});
            if(user){
                res.send({status:"SUCCESS",account : user.accountNumber})
            }else{
                res.send({status:"FAILED",message:"Something went wrong"});
            }
        } catch (error) {
            res.send({status:"FAILED",message:"Error cannot fetch Account Number"});
        }
    }
    static getTransaction = async (req,res)=>{ // active
        try {
            let user = await userModel.findOne({"_id":req.id}).select('lastTransaction -_id');
            let resultArray = [];
            if(user.lastTransaction.length >= 1){
                for(let i =0 ; i < user.lastTransaction.length ; i++){
                    resultArray.push(user.lastTransaction[i])
                }  
            }
            res.send({status:"SUCCESS",message : "successfully fetch transactions",data : resultArray})
        } catch (error) {
            res.send("Error initia server error")
        }
    }

}


module.exports = clientControllers;   