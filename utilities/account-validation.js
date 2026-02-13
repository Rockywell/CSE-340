const utilities = require(".")
const { body, validationResult } = require("express-validator")
const accountModel = require("../models/account-model")


const validate = {}

/*  **********************************
  *  Registration Data Validation Rules
  * ********************************* */
validate.registationRules = () => {
    return [
        // firstname is required and must be string
        body("account_firstname")
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 1 })
            .withMessage("Please provide a first name."), // on error this message is sent.

        // lastname is required and must be string
        body("account_lastname")
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 2 })
            .withMessage("Please provide a last name."), // on error this message is sent.

        // valid email is required and cannot already exist in the DB
        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail() // refer to validator.js docs
            .withMessage("A valid email is required.")
            .custom(async (account_email) => {
                const emailExists = await accountModel.checkExistingEmail(account_email)
                if (emailExists) {
                    throw new Error("Email exists. Please log in or use different email")
                }
            }),

        // password is required and must be strong password
        body("account_password")
            .trim()
            .notEmpty()
            .isStrongPassword({
                minLength: 12,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            .withMessage("Password does not meet requirements."),
    ]
}

/*  **********************************
  *  Login Data Validation Rules
  * ********************************* */
validate.loginRules = () => {
    return [
        // valid email is required and cannot already exist in the DB
        body("account_email")
            .trim()
            .isEmail()
            .normalizeEmail() // refer to validator.js docs
            .withMessage("A valid email is required."),

        // password is required and must be strong password
        body("account_password")
            .trim()
            .notEmpty()
            .isStrongPassword({
                minLength: 12,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            .withMessage("Password does not meet requirements."),
    ]
}

/*  **********************************
  *  Update Data Validation Rules
  * ********************************* */
validate.updateRules = () => {
    return [
        // firstname
        body("account_firstname")
            .optional()
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 1 })
            .withMessage("Please provide a first name."),

        // lastname
        body("account_lastname")
            .optional()
            .trim()
            .escape()
            .notEmpty()
            .isLength({ min: 2 })
            .withMessage("Please provide a last name."),

        // email
        body("account_email")
            .optional()
            .trim()
            .isEmail()
            .normalizeEmail()
            .withMessage("A valid email is required.")
            .bail()
            .custom(async (account_email, { req }) => {
                const account_id = utilities.getTargetAccountId(req);
                // Skips checking for an existing email if it's unchanged.
                if (await accountModel.checkExistingEmail(account_email, account_id)) return true;

                const emailExists = await accountModel.checkExistingEmail(account_email)
                if (emailExists) {
                    throw new Error("Email exists. Please log in or use different email")
                }
            }),
        // password (only validate if user typed one)
        body("account_password")
            .optional({ checkFalsy: true })
            .trim()
            .notEmpty()
            .isStrongPassword({
                minLength: 12,
                minLowercase: 1,
                minUppercase: 1,
                minNumbers: 1,
                minSymbols: 1,
            })
            .withMessage("Password does not meet requirements.")
            .custom(async (password, { req }) => {
                const account_id = utilities.getTargetAccountId(req);

                const passwordExists = await accountModel.checkExistingPassword(account_id, password);

                if (passwordExists) {
                    throw new Error("New password must be different from the old password.");
                }
            })
    ]
}

/*  **********************************
  *  Update Role/Account Type Data Validation Rules
  * ********************************* */
validate.updateTypeRules = () => {
    return [
        body("account_type")
            .trim()
            .notEmpty()
            .withMessage("An account type is required.")
            .bail()
            .escape()
            .custom(async (type, { req }) => {
                const userAccount = await accountModel.getAccountById(req.actorId);
                const validTypes = await accountModel.getAccountTypes();

                // Checks if the provided type is one of the valid types e.g. ["Client", "Employee", "Admin"] and that the user can grant that type.
                let roleIsAcessible = await utilities.canAccessRole(userAccount.account_type, type)

                if (!roleIsAcessible) {
                    throw new Error("You don't have permission to assign that account type.");
                }
            })
    ]
}

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
    const { account_firstname, account_lastname, account_email } = req.body
    let errors = []
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        res.render("account/register", {
            errors,
            title: "Registration",
            nav,
            account_firstname,
            account_lastname,
            account_email,
        })
        return
    }
    next()
}

/* ******************************
 * Check data and return errors or continue to login
 * ***************************** */
validate.checkLoginData = async (req, res, next) => {
    const { account_email } = req.body
    let errors = []
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        res.render("account/login", {
            errors,
            title: "Login",
            nav,
            account_email,
        })
        return
    }
    next()
}

/* ******************************
 * Check data and return errors or continue to edit-account
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
    const { account_firstname, account_lastname, account_email } = req.body
    let errors = []
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        res.render("account/edit-account", {
            errors,
            title: "Edit Account",
            nav,
            account_firstname,
            account_lastname,
            account_email
        })
        return
    }
    next()
}

/* ******************************
 * Check data and return errors or continue to edit-account-role
 * ***************************** */
validate.checkRoleUpdateData = async (req, res, next) => {
    const userAccount = res.locals.accountData;

    let targetAccount = await accountModel.getAccountById(req.params.accountId);
    delete targetAccount.account_password;

    const { account_type } = req.body


    let errors = []
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        let accountTypeSelect = await utilities.buildAccountTypeSelect(userAccount.account_type, targetAccount.account_type)

        res.render("account/edit-account-role", {
            errors,
            title: "Edit Account Role",
            nav,
            account_type,
            targetAccount,
            accountTypeSelect,
        })
        return
    }
    next()
}

module.exports = validate