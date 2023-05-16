const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/connection');
app.use(express.json())
app.use(cors({origin : "*"}));
app.use(express.urlencoded({extended:true}))
connectDB();


app.use('/client',require('./routes/clientRoutes'));
app.use('/admin',require('./routes/adminRoutes'));

app.listen(3000,()=>{
    console.log("Server is up on http://127.0.0.1:3000")
})