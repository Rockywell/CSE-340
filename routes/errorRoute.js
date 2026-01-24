const express = require("express")
const router = new express.Router()
const baseController = require("../controllers/baseController")

const utilities = require("../utilities/")

router.get("/500", utilities.handleErrors(baseController.triggerError));

module.exports = router;