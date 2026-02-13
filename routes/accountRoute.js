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

// Fixes the route because only the owner of the account should be able to change everything about their account especially password.
router.get("/update", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountEditor));
// Process to edit any selected account's role (account type).
router.get("/update/:accountId/role", utilities.checkEmployeeOrAdmin, utilities.canEditUser, utilities.handleErrors(accountController.buildAccountRoleEditor));


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

// Process new account data on user's account.
router.post(
    "/update",
    regValidate.updateRules(),
    regValidate.checkUpdateData,
    utilities.handleErrors(accountController.updateAccount)
)

// Admin/staff updating another accounts role
router.post(
    "/update/:accountId/role",
    utilities.checkEmployeeOrAdmin,
    utilities.canEditUser,
    regValidate.updateTypeRules(),
    regValidate.checkRoleUpdateData,
    utilities.handleErrors(accountController.updateAccountRole)
);


module.exports = router;