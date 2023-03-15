const router = require("express").Router();
const clientController = require("../controllers/clientControllers")
const auth_middleware = require("../middlewares/auth-middleware")


router.get("/testClient",(req,res)=>{
    res.send("Client routes is Up and proper running")
})


// protected routes

router.get("/deposit",auth_middleware,clientController.depositAmount);


// public routes
router.post("/login",clientController.login);


module.exports = router;