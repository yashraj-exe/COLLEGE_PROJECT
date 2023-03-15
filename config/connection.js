const mongoose = require('mongoose')
const dotenv = require("dotenv").config();

const OPTIONS = {
    dbName: "PROJECT_BANK"
}

const connectDB = async () => {
    try {
        const response = await mongoose.connect(process.env.MONGO_CONNECTION_URL,OPTIONS)
        console.log('Connected Successfully');
    } catch (error) {
        console.log("THis is ERROR",error)
    }
}


module.exports = connectDB;