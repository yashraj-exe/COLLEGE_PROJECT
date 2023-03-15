const dotenv = require('dotenv').config();
const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const randomize = require('randomatic');
const Excel = require('exceljs')
const path = require('path');
const moment = require('moment');

class adminControllers{

    static adminLogin = async (req,res)=>{
        const {username,password} = req.body;
        if(username && password){
            if(username === "SUPER_ADMIN" && password === "ADMIN@123"){
                res.send({status : "SUCCESS",message : "Successfully login"})
            }else{
                res.send({status : "FAILED",message : "Admin password and user is invalid"})
            }
        }else{
            res.send({status : "FAILED",message : "Admin password and user is invalid"})
        }
    }

    static registerClient = async (req, res) => {
        const { user, email, phone, address} = req.body;
        const userData = await userModel.findOne({ email: email });
        if (userData) {
            res.send({ status: "Failed", message: "Email already Registered" })
        } else {
            if (user && email && phone && address) {
                let phoneData = await userModel.findOne({phone : phone});
                if (!phoneData) {
                    try {
                        let password = randomize('0A',5);
                        const salt = await bcrypt.genSalt(10);
                        const hashPassword = await bcrypt.hash(password, salt)
                        const newUser = new userModel({
                            username: user,
                            email: email,
                            password: hashPassword,
                            accountNumber : randomize('0',10),
                            address,
                            phone
                        })
                        const saveResponse = await newUser.save()
                        return res.send({ status: "Success", message: "Client Register Successfully",password})

                    } catch (err) {
                        res.send({ status: "Failed", message: "Unable to register client ", error: err.message })
                    }
                } else {
                    res.send({ status: "Failed", message: "Phone number allready exist" })
                }
            } else {
                res.send({ status: "Failed", message: "All fields are required" })
            }
        }

    }
    static deleteClient = async(req,res)=>{
        try {
            let accountNumber = req.params.accountNumber;
            const user = await userModel.findOne({accountNumber : accountNumber});
            if(user){
                let x = await userModel.deleteOne({accountNumber : accountNumber });
                console.log(x)
                res.send("Delete success")
            }else{
                res.send({message : "Account number is not valid",status : '404'});
            }
        } catch (error) {
            res.send("Error in deleting account, something went wrong")
        }
        
    }
    static freezAccount = async(req,res)=>{
        let {value,accountNumber} = req.body;
        try {
            let user = await userModel.findOne({accountNumber : accountNumber});
            if(user){
                await userModel.updateOne({accountNumber : accountNumber},{$set : {isFreez : value}});
                res.send("Account Freeze successfully")
            }else{
                res.send({message : "Account number is not valid",status : '404'});
            }
        } catch (error) {
            res.send("Error in Freezeing account, something went wrong")
        }
        
    }
    static unfreezAccount = async(req,res)=>{
       let {value,accountNumber} = req.body;
        try {
            let user = await userModel.findOne({accountNumber : accountNumber});
            if(user){
                await userModel.updateOne({accountNumber : accountNumber},{$set : {isFreez : value}});
                res.send("Account UnFreeze successfully")
            }else{
                res.send({message : "Account number is not valid",status : '404'});
            }
        } catch (error) {
            res.send("Error in UnFreezeing account, something went wrong")
        }
        
    }
    static getAllClients = async (req,res)=>{
        try {
            let allUser = await userModel.find().select('-password -lastTransaction -_id -__v');
            res.send(allUser)
        } catch (error) {
            res.send("Error in fetching clients details, something went wrong")
        }

    }
    static getClientExcel = async (req,res)=>{
        try {

            let users = await userModel.find().sort("date");
            let workbook1 = new Excel.Workbook();
            try {
                    let sheet = workbook1.addWorksheet('sheet1');
    
                    sheet.getRow(1).getCell(1).value = "Sr.No"
                    sheet.getRow(1).getCell(2).value = "JOINING DATE"
                    sheet.getRow(1).getCell(3).value = "USER NAME"
                    sheet.getRow(1).getCell(4).value = "EMAIL"
                    sheet.getRow(1).getCell(5).value = "PHONE"
                    sheet.getRow(1).getCell(6).value = "ADDRESS"
                    sheet.getRow(1).getCell(7).value = "TOTAL TRANSACTION"
                    sheet.getRow(1).getCell(8).value = "is FREEZE"
                    sheet.getRow(1).getCell(9).value = "BALANCE"
    
                    let a = sheet.getColumn(2)
                    let b = sheet.getColumn(3)
                    let c = sheet.getColumn(4)
                    let d = sheet.getColumn(5)
                    let e = sheet.getColumn(6)
                    let f = sheet.getColumn(7)
                    let g = sheet.getColumn(8)
                    let h = sheet.getColumn(9)
                    let count = 0;
    
                    a.width = 15
                    b.width = 25
                    c.width = 40
                    d.width = 20
                    e.width = 25
                    f.width = 19
                    g.width = 20
                    h.width = 15
    
                    for(let j = 0 ; j < users.length; j ++){
                        count += 1;
                        let join = moment(users[j].join).format("DD-MM-YYYY");
                        let isFreez = JSON.stringify(users[j].isFreez)
                        sheet.getRow(count + 1).getCell(1).value = count;
                        sheet.getRow(count + 1).getCell(2).value = join || "";
                        sheet.getRow(count + 1).getCell(3).value = users[j].username || "";
                        sheet.getRow(count + 1).getCell(4).value = users[j].email || "";
                        sheet.getRow(count + 1).getCell(5).value = users[j].phone || "";
                        sheet.getRow(count + 1).getCell(6).value = users[j].address || "";
                        sheet.getRow(count + 1).getCell(7).value = users[j].lastTransaction.length || "";
                        sheet.getRow(count + 1).getCell(8).value = isFreez || "";
                        sheet.getRow(count + 1).getCell(9).value = users[j].balance || "";
                    }

                let fileName = `clients_data.xls`;
                let pathToSave = path.join(process.cwd(),'Excel','Admin',fileName);
                try {
                    await workbook1.xlsx.writeFile(pathToSave);
                    res.send("Success")
                } catch (error) {
                    res.send("Error in saving excel file")
                }
            } catch (error) {
                console.log(error)
                res.send("Error in making excel")
            }
          
            
        } catch (error) {
            res.send("Error initia server error")
        }
    }
    static getSpecificClientTransactionExcel = async (req,res)=>{
        try {
            let date = new Date()
            let user = await userModel.findOne({'accountNumber':req.body.account});
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
                    let fileName = `${user.username}_${moment(date).format("DD-MM-YYYY")}.xls`;
                    let pathToSave = path.join(process.cwd(),'Excel','Admin','Specific Client Transaction',fileName);
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
    static getAllClientsTransactionDeatils = async (req,res)=>{
        try {
            let users = await userModel.find();
            let workbook1 = new Excel.Workbook();
            for(let i = 0 ; i < users.length; i++){
                let sheet = workbook1.addWorksheet(`${users.username}_${i}`);
                
            }
        } catch (error) {
            res.send("Error initial server error")
        }
    }
}

module.exports = adminControllers;