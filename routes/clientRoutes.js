const router = require("express").Router();
const clientController = require("../controllers/clientControllers")


router.get("/testClient",(req,res)=>{
    res.send("Client routes is Up and proper running")
})

router.post("/login",clientController.login);

module.exports = router;