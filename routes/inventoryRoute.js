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

// Process to edit vehicle data
router.get("/edit/:inventoryId", utilities.handleErrors(invController.buildInventoryEditor));

router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));
router.get("/detail/:inventoryId", utilities.handleErrors(invController.buildByInventoryId));

router.get("/getInventory/:classification_id", utilities.handleErrors(invController.getInventoryJSON))


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
// Process updated inventory data
router.post("/update/",
    invValidate.newInventoryRules(),
    invValidate.checkUpdateData,
    utilities.handleErrors(invController.updateInventory))



module.exports = router;