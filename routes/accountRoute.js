// Needed Resources 
const express = require("express")
const router = new express.Router()
const accountController = require("../controllers/accountController")

const utilities = require("../utilities/")
const regValidate = require('../utilities/account-validation')


// Route to build inventory by classification view
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildManager));
router.get("/login", utilities.handleErrors(accountController.buildLogin));
router.get("/logout", utilities.handleErrors(accountController.logout));
router.get("/register", utilities.handleErrors(accountController.buildRegister));

router.get("/update/:accountId", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountEditor));


// Process the registration data
router.post(
    "/register",
    regValidate.registationRules(),
    regValidate.checkRegData,
    utilities.handleErrors(accountController.registerAccount)
)
// Process the login attempt
router.post(
    "/login",
    regValidate.loginRules(),
    regValidate.checkLoginData,
    utilities.handleErrors(accountController.accountLogin)
)

router.post(
    "/update",
    regValidate.updateRules(),
    regValidate.checkUpdateData,
    utilities.handleErrors(accountController.updateAccount)
)



module.exports = router;