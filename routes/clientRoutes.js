const router = require("express").Router();
const clientController = require("../controllers/clientControllers")
const auth_middleware = require("../middlewares/auth-middleware")


router.get("/testClient",(req,res)=>{
    res.send("Client routes is Up and proper running")
})


// protected routes

router.post("/deposit",auth_middleware,clientController.depositAmount);
router.post("/withdraw",auth_middleware,clientController.withdrawAmount);
router.post("/transfer",auth_middleware,clientController.transferAmount);
router.get("/accountNumber",auth_middleware,clientController.accountNumber)
router.get("/getExcel",auth_middleware,clientController.getExcel)
router.get("/transaction",auth_middleware,clientController.getTransaction);
router.get("/checkBalance",auth_middleware,clientController.checkBalance);


// public routes
router.post("/login",clientController.login);


module.exports = router;