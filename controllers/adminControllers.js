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
}

module.exports = adminControllers;