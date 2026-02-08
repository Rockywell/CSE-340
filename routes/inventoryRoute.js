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
router.get("/", utilities.checkEmployeeOrAdmin, utilities.handleErrors(invController.buildManager));

router.get("/add-class", utilities.checkEmployeeOrAdmin, utilities.handleErrors(invController.buildClassificationRegister));
router.get("/add-item", utilities.checkEmployeeOrAdmin, utilities.handleErrors(invController.buildInventoryRegister));

// Process to edit vehicle data
router.get("/edit/:inventoryId", utilities.checkEmployeeOrAdmin, utilities.handleErrors(invController.buildInventoryEditor));
router.get("/delete/:inventoryId", utilities.checkEmployeeOrAdmin, utilities.handleErrors(invController.buildInventoryDeleter));

router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));
router.get("/detail/:inventoryId", utilities.handleErrors(invController.buildByInventoryId));

router.get("/getInventory/:classificationId", utilities.handleErrors(invController.getInventoryJSON))


// Process new classification data
router.post(
    "/add-class",
    utilities.checkEmployeeOrAdmin,
    invValidate.classificationRules(),
    invValidate.checkClassificationData,
    utilities.handleErrors(invController.registerClassification)
)
router.post(
    "/add-item",
    utilities.checkEmployeeOrAdmin,
    invValidate.inventoryRules(),
    invValidate.checkInventoryData,
    utilities.handleErrors(invController.registerInventory)
)
// Process updated inventory data
router.post("/update/",
    utilities.checkEmployeeOrAdmin,
    invValidate.newInventoryRules(),
    invValidate.checkUpdateData,
    utilities.handleErrors(invController.updateInventory)
)
router.post("/delete/",
    utilities.checkEmployeeOrAdmin,
    invValidate.newInventoryRules(),
    // invValidate.checkUpdateData,
    utilities.handleErrors(invController.deleteInventory)
)



module.exports = router;