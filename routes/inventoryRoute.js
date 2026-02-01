// Needed Resources 
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")

const utilities = require("../utilities/")
const invValidate = require('../utilities/inventory-validation')

// Route to build inventory by classification view
// router.get("/", (req, res) => {
//     res.status(200).send('d process')
// });
router.get("/", utilities.handleErrors(invController.buildManager));
router.get("/add-class", utilities.handleErrors(invController.buildClassificationRegister));
router.get("/add-item", utilities.handleErrors(invController.buildInventoryRegister));
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));
router.get("/detail/:inventoryId", utilities.handleErrors(invController.buildByInventoryId));

// Process new classification data
router.post(
    "/add-class",
    invValidate.classificationRules(),
    invValidate.checkClassificationData,
    utilities.handleErrors(invController.registerClassification)
)
router.post(
    "/add-item",
    invValidate.inventoryRules(),
    invValidate.checkInventoryData,
    utilities.handleErrors(invController.registerInventory)
)


module.exports = router;