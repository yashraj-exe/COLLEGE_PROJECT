const router = require("express").Router();
const adminControler = require("../controllers/adminControllers");

router.get("/testAdmin",(req,res)=>{
    res.send("Admin routes is Up and proper running")
})

router.post("/register",adminControler.registerClient);
router.post("/login",adminControler.adminLogin);
router.get("/deleteClient/:accountNumber",adminControler.deleteClient)
router.post("/freezaccount",adminControler.freezAccount);
router.post("/unfreezaccount",adminControler.unfreezAccount);
router.get("getAllClients",adminControler.getAllClients);

module.exports = router;