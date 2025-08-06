const router = require('express').Router();
const  ensureAuthenticated   = require("../Middlewares/AuthMiddleware");
const { addHolding,getHoldings,getPortfolioStats,deleteHolding,updateHoldings} = require("../Controllers/HoldingController");

router.post("/add",ensureAuthenticated,addHolding);
router.get("/get",ensureAuthenticated,getHoldings);

router.get("/stats", ensureAuthenticated, getPortfolioStats);
router.delete("/:id",ensureAuthenticated,deleteHolding);
router.put("/:id",ensureAuthenticated,updateHoldings)
module.exports = router;