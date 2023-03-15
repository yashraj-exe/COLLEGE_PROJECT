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
    static checkBalance = async (req,res)=>{
        try {
            let user = await userModel.findOne({'_id':req.id},{balance : 1,_id : 0});
            res.send({status : "Success",code : 200, balance : user.balance.toFixed(2)});
        } catch (error) {
            res.send("Errror cannot check balance something went wrong");
        }
    }
    static depositAmount = async (req,res)=>{
        
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
                            res.send("Balance Deposite Successfully");
                        }else{
                            res.send("Incorrect Password")
                        }
                    }else{
                        res.send("Error enter valid Amount")
                    }
                }else{
                    res.send("Error Sorry your account is Freez kindly contact Admin")
                }
                
            }else res.send("Error Something went wrong")
        } catch (error) {
            console.log("ERRROR 01",error)
            res.send("ERROR 404")
            
        }
    }
    static withdrawAmount = async (req,res)=>{
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
                                res.send("Amount withdraw successfully");
                            }else{
                                res.send("Enter valid ammount");
                            }
                        }else{
                            res.send("Insufficient funds")
                        }
                    }else res.send("Password is Incorrect")
                }else{
                    res.send("Error Sorry your account is Freez kindly contact Admin")
                }
            }else{
                res.send("Error Something went wrong")
            }
        } catch (error) {
            console.log(error)
            res.send("Error cannot not Deposite Amount");
        }
    }
    static transferAmount = async (req,res)=>{
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
                            res.send("Successfully Transfer ammount");
                        }else{
                            res.send("Receiver account not found");
                        }
                    }else{
                        res.send("Insufficient funds");
                    }
                }else{
                    res.send("Error Sorry your account is Freez kindly contact Admin")
                }
            }else{
                res.send("Something went wrong");
            }
        } catch (error) {
            console.log(error)
            res.send("Error cannot transfer amount");
        }
    }
    static accountNumber = async (req,res)=>{
        try {
            let user = await userModel.findOne({'_id':req.id});
            if(user){
                res.send({account : user.accountNumber})
            }else{
                res.send("Something went wrong")
            }
        } catch (error) {
            res.send("Error cannot fetch Account Number");
        }
    }
    static getExcel = async (req,res)=>{
        try {

            let user = await userModel.findOne({'_id':req.id});
            if(!user){
                res.send("Error User not found");
            }else{
                try {
                    let json = user.lastTransaction;
                    let workbook1 = new Excel.Workbook();
                    let sheet1 = workbook1.addWorksheet('Sheet1');

                    sheet1.getRow(1).getCell(1).value = "Sr.No"
                    sheet1.getRow(1).getCell(2).value = "Date"
                    sheet1.getRow(1).getCell(3).value = "Type"
                    sheet1.getRow(1).getCell(4).value = "Debit"
                    sheet1.getRow(1).getCell(5).value = "Credit"
                    sheet1.getRow(1).getCell(6).value = "Balance"
                    sheet1.getRow(1).getCell(7).value = "To"
                    let count = 0;
                    let Date = sheet1.getColumn(2);
                    let Type = sheet1.getColumn(3);
                    let Debit = sheet1.getColumn(4);
                    let Credit = sheet1.getColumn(5);
                    let Balance = sheet1.getColumn(6)
                    let To = sheet1.getColumn(7)
                    Date.width = 30;
                    Type.width = 20;
                    Credit.width = 15;
                    Balance.width = 15;
                    To.width = 15;
                    Debit.width = 15;
                    for(let i = 0 ; i < json.length; i++){
                        count += 1;
                        sheet1.getRow(count + 1).getCell(1).value = count;
                        sheet1.getRow(count + 1).getCell(2).value = json[i].date;
                        sheet1.getRow(count + 1).getCell(3).value = json[i].type;
                        sheet1.getRow(count + 1).getCell(4).value = json[i].debit;
                        sheet1.getRow(count + 1).getCell(5).value = json[i].credit;
                        sheet1.getRow(count + 1).getCell(6).value = json[i].balance;
                        sheet1.getRow(count + 1).getCell(7).value = json[i].to;
                    }
                    let fileName = `${user.username}_${moment(date).format('DD-MM-YY')}.xls`;
                    let pathToSave = path.join(process.cwd(),'Excel',fileName);
                    console.log(pathToSave)
                    try {
                        await workbook1.xlsx.writeFile(pathToSave)
                        res.send("Success");
                    } catch (error) {
                        console.log(error)
                        res.send("Error in saving XLSX")
                    }

                } catch (error) {
                    console.log(error)
                    res.send("Error in writing Excel")
                }
            }
        } catch (error) {
            res.send("Error cannot Create excel")
        }
    }
    static getTransaction = async (req,res)=>{
        try {
            let user = await userModel.findOne({"_id":req.id}).select('lastTransaction -_id');
            let resultArray = [];
            for(let i =0 ; i < 10 ; i++){
                resultArray.push(user.lastTransaction[i])
            }  
            res.send({message : "success",data : resultArray})
        } catch (error) {
            res.send("Error initia server error")
        }
    }

}


module.exports = clientControllers;   