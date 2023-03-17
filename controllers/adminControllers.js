const dotenv = require('dotenv').config();
const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const randomize = require('randomatic');
const Excel = require('exceljs')
const path = require('path');
const moment = require('moment');

class adminControllers{

    static adminLogin = async (req,res)=>{ // active
        const {email,password,role} = req.body;
        if(email && password){
            if(email === "admin@admin.com" && password === "admin@123" && role === "admin"){
                res.send({status : "SUCCESS",message : "Successfully login",name : "SUPER_ADMIN"})
            }else{
                res.send({status : "FAILED",message : "Admin password and username is invalid"})
            }
        }else{
            res.send({status : "FAILED",message : "All fields are required"})
        }
    }
    static registerClient = async (req, res) => { // active
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
                            phone,
                            tempPassword : password
                        })
                        const saveResponse = await newUser.save()
                        return res.send({ status: "SUCCESS", message: "Client Register Successfully",password})

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
    static deleteClient = async(req,res)=>{ // active
        try {
            let accountNumber = req.params.accountNumber;
            const user = await userModel.findOne({accountNumber : accountNumber});
            if(user){
                let x = await userModel.deleteOne({accountNumber : accountNumber });
                console.log(x)
                res.send({message :"Delete success",status : "SUCCESS"})
            }else{
                res.send({message : "Account number is not valid",status : 'Failed'});
            }
        } catch (error) {
            res.send({message : "Error in deleting account, something went wrong",status : 'Failed'});
        }
        
    }
    static freezAccount = async(req,res)=>{ // active
        let {accountNumber} = req.body;
        try {
            let user = await userModel.findOne({accountNumber : accountNumber});
            if(user){
                await userModel.updateOne({accountNumber : accountNumber},{$set : {isFreez : true}});
                res.send({message : "Account Freeze successfully", status : "SUCCESS"})
            }else{
                res.send({message : "Account number is not valid",status : 'FAILED'});
            }
        } catch (error) {
            res.send({message : "Error in Freezeing account, something went wrong",status : 'FAILED'});
        }
        
    }
    static unfreezAccount = async(req,res)=>{ // active
       let {value,accountNumber} = req.body;
        try {
            let user = await userModel.findOne({accountNumber : accountNumber});
            if(user){
                await userModel.updateOne({accountNumber : accountNumber},{$set : {isFreez : value}});
                res.send({message : "Account UnFreeze successfully", status : "SUCCESS"})
            }else{
                res.send({message : "Account number is not valid",status : 'Failed'});
            }
        } catch (error) {
            res.send({message : "Error in UnFreezeing account, something went wrong",status : 'Failed'});
        }
        
    }
    static getAllClients = async (req,res)=>{
        try {
            let allUser = await userModel.find().select('-password -lastTransaction -_id -__v');
            res.send({data :allUser,status : "SUCCESS"})
        } catch (error) {
            res.send({message : "Error in fetching clients details, something went wrong",status : "FAILED"})
        }

    }

    static crossCheck = async (req,res)=>{
        const accountNumber = req.params.accountNumber;
        let data = await userModel.findOne({accountNumber : accountNumber});
        if(data !== null && data !== ""){
            res.send({status:"SUCCESS",data : {
                name : data.username,
                email : data.email,
                phone : data.phone
            }})
        }else{
            res.send({status:"400",message:"Account not found"})
        }
    }
}

module.exports = adminControllers;