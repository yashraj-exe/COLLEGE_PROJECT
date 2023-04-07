const dotenv = require('dotenv').config();
const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const randomize = require('randomatic');
const Excel = require('exceljs')
const path = require('path');
const moment = require('moment');
const loanModel = require("../models/loanModel")

class adminControllers {

    static adminLogin = async (req, res) => { // active
        const { email, password, role } = req.body;
        if (email && password) {
            if (email === "admin@admin.com" && password === "admin@123" && role === "admin") {
                res.send({ status: "SUCCESS", message: "Successfully login", name: "SUPER_ADMIN" })
            } else {
                res.send({ status: "FAILED", message: "Admin password and username is invalid" })
            }
        } else {
            res.send({ status: "FAILED", message: "All fields are required" })
        }
    }
    static registerClient = async (req, res) => { // active
        const { user, email, phone, address } = req.body;
        const userData = await userModel.findOne({ email: email });
        if (userData) {
            res.send({ status: "Failed", message: "Email already Registered" })
        } else {
            if (user && email && phone && address) {
                let phoneData = await userModel.findOne({ phone: phone });
                if (!phoneData) {
                    try {
                        let password = randomize('0A', 5);
                        const salt = await bcrypt.genSalt(10);
                        const hashPassword = await bcrypt.hash(password, salt)
                        const newUser = new userModel({
                            username: user,
                            email: email,
                            password: hashPassword,
                            accountNumber: randomize('0', 10),
                            address,
                            phone,
                            tempPassword: password
                        })
                        const saveResponse = await newUser.save()
                        return res.send({ status: "SUCCESS", message: "Client Register Successfully", password })

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
    static deleteClient = async (req, res) => { // active
        try {
            let accountNumber = req.params.accountNumber;
            const user = await userModel.findOne({ accountNumber: accountNumber });
            if (user) {
                let x = await userModel.deleteOne({ accountNumber: accountNumber });
                res.send({ message: "Delete success", status: "SUCCESS" })
            } else {
                res.send({ message: "Account number is not valid", status: 'Failed' });
            }
        } catch (error) {
            res.send({ message: "Error in deleting account, something went wrong", status: 'Failed' });
        }

    }
    static freezAccount = async (req, res) => { // active
        let { accountNumber } = req.body;
        try {
            let user = await userModel.findOne({ accountNumber: accountNumber });
            if (user) {
                await userModel.updateOne({ accountNumber: accountNumber }, { $set: { isFreez: true } });
                res.send({ message: "Account Freeze successfully", status: "SUCCESS" })
            } else {
                res.send({ message: "Account number is not valid", status: 'FAILED' });
            }
        } catch (error) {
            res.send({ message: "Error in Freezeing account, something went wrong", status: 'FAILED' });
        }

    }
    static unfreezAccount = async (req, res) => { // active
        let { accountNumber } = req.body;
        try {
            let user = await userModel.findOne({ accountNumber: accountNumber });
            if (user) {
                await userModel.updateOne({ accountNumber: accountNumber }, { $set: { isFreez: false } });
                res.send({ message: "Account UnFreeze successfully", status: "SUCCESS" })
            } else {
                res.send({ message: "Account number is not valid", status: 'Failed' });
            }
        } catch (error) {
            res.send({ message: "Error in UnFreezeing account, something went wrong", status: 'Failed' });
        }

    }
    static getAllClients = async (req, res) => {
        try {
            let allUser = await userModel.find().select('-password -lastTransaction -_id -__v');
            res.send({ data: allUser, status: "SUCCESS" })
        } catch (error) {
            res.send({ message: "Error in fetching clients details, something went wrong", status: "FAILED" })
        }

    }
    static crossCheck = async (req, res) => {
        const accountNumber = req.params.accountNumber;
        let data = await userModel.findOne({ accountNumber: accountNumber });
        if (data !== null && data !== "") {
            res.send({
                status: "SUCCESS", data: {
                    name: data.username,
                    email: data.email,
                    phone: data.phone
                }
            })
        } else {
            res.send({ status: "400", message: "Account not found" })
        }
    }

    static approveLoan = async (req, res) => {
        const { status, accountNumber, loanid } = req.body;

        let loanStatus = loanModel.findOne({ loanID: loanid });

        if (loanStatus.status === "pending") {
            if (status === "decline") {
                await loanModel.findOneAndUpdate({ loanID: loanid }, { $set: { status: status } });
                await userModel.findOneAndUpdate({ accountNumber }, { $set: { loanStatus: status, loanID: "" } });
                return res.send({ status: "SUCCESS", message: "Successfully decline the Loan" })
            }
            
            let loanDocument = await loanModel.findOne({ loanID: loanid });
            if (loanDocument === "" || loanDocument === null) {
                return res.send({ status: "FAILED", message: "Loan Document not found" })
            }

            let user = await userModel.findOne({ accountNumber });

            if (user === "" || user === undefined) {
                return res.send({ status: "FAILED", message: "Client not found !" })
            }

            let type = loanDocument.loanType;
            let amount = Number(loanDocument.loanAmmount);
            let year = Number(loanDocument.loanYears);

            let interestRate = (type === "home") ? 10 : 12;
            let intersetAmmount = ((amount * year * interestRate) / 100);
            let numberOfEMI = year * 12;
            let perMonthEmi = (intersetAmmount + amount) / numberOfEMI;
            let totalAmount = intersetAmmount + amount;
            console.log(totalAmount)
            let allEmiDetails = [];

            let amountRemaning = totalAmount
            for (let i = 0; i < numberOfEMI; i++) {
                let tempObj = {
                    loanID: loanid,
                    id: i + 1,
                    emiAmmount: Number(perMonthEmi).toFixed(3),
                    amountRemaning: amountRemaning.toFixed(3),
                    nextEmi: moment().add(i + 1, "M").format("DD MM YYYY"),
                    status: "unpaid",
                    emiSubmiteDate: "",
                }
                allEmiDetails.push(tempObj)
                amountRemaning = amountRemaning - perMonthEmi;
            }

            let userBalance = user.balance;
            let newUserBalance = userBalance + amount;
            await userModel.findOneAndUpdate({ accountNumber: accountNumber }, { $set: { loanDetails: { loanIssueDate: moment().format("DD MM YYYY"), loanIssueTill: moment().add(numberOfEMI, "M").format("DD MM YYYY"), EMI: allEmiDetails }, loanStatus: status, balance: newUserBalance } });
            await loanModel.findOneAndUpdate({ loanID: loanid }, { $set: { status: status, emi: allEmiDetails, loanIssueDate: moment().format("DD MM YYYY"), loanIssueTill: moment().add(numberOfEMI, "M").format("DD MM YYYY") } })
            res.send({ status: "SUCCESS", message: "Successfully approved loan", data: allEmiDetails });
        }else{
            return res.send({ status: "FAILED", message: "Loan already approved" })
        }
    }
    
    static getAllLoanDeatails = async (req, res) => {
        try {
            let loanDetails = await loanModel.find();
            if (loanDetails !== [] && loanDetails !== undefined && loanDetails !== "") {
                res.send({ status: "SUCCESS", message: "Successfully fetch Data", data: loanDetails })
            } else {
                res.send({ status: "STATUS", message: "Unable to fetch loan details" });
            }
        } catch (error) {
            res.send({ status: "FAILED", message: "Unable to fetch loan details" })
        }
    }

    static getALLClients = async (req, res) => {
        try {
            let loanDetails = await loanModel.find();
            if (loanDetails !== undefined && loanDetails !== "" && loanDetails !== []) {
                res.send({ status: "SUCCESS", message: "Successfully fetch data" });
            }
        } catch (error) {
            res.send({ status: "FAILLED", message: "Unable to fetch data" });
        }
    }
}

module.exports = adminControllers;