const router = require("express").Router();
const adminControler = require("../controllers/adminControllers");

router.get("/testAdmin",(req,res)=>{
    res.send("Admin routes is Up and proper running")
})

router.post("/register",adminControler.registerClient);

module.exports = router;