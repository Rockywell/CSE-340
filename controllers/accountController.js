const jwt = require("jsonwebtoken")
const utilities = require("../utilities/")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
require("dotenv").config()


const accountController = {}


/* Login View */
accountController.buildLogin = async function (req, res) {
    const nav = await utilities.getNav()
    res.render("account/login", {
        title: "Login",
        nav,
        errors: null
    })
}


/* ****************************************
*  Deliver registration view
* *************************************** */
accountController.buildRegister = async function (req, res, next) {
    let nav = await utilities.getNav()
    res.render("account/register", {
        title: "Register",
        nav,
        errors: null
    })
}

accountController.buildManager = async function (req, res) {
    const nav = await utilities.getNav()
    const accountSelect = await utilities.buildAccountSelect(req.actorId)
    res.render("account/management", {
        title: "Account Management",
        nav,
        accountSelect,
        errors: null
    })
}

accountController.buildAccountEditor = async function (req, res) {
    const nav = await utilities.getNav()
    res.render("account/edit-account", {
        title: "Edit Account",
        nav,
        errors: null
    })
}

accountController.buildAccountRoleEditor = async function (req, res) {
    const userAccount = res.locals.accountData;

    let targetAccount = await accountModel.getAccountById(req.params.accountId);
    delete targetAccount.account_password;


    const nav = await utilities.getNav()
    const accountTypeSelect = await utilities.buildAccountTypeSelect(userAccount.account_type, targetAccount.account_type)

    res.render("account/edit-account-role", {
        title: "Edit Account Role",
        nav,
        targetAccount,
        accountTypeSelect,
        errors: null
    })
}



/* ****************************************
*  Process Registration
* *************************************** */
accountController.registerAccount = async function (req, res) {
    let nav = await utilities.getNav()
    const { account_firstname, account_lastname, account_email, account_password } = req.body

    // Hash the password before storing
    let hashedPassword
    try {
        // regular password and cost (salt is generated automatically)
        hashedPassword = await bcrypt.hashSync(account_password, 10)
    } catch (error) {
        req.flash("notice", 'Sorry, there was an error processing the registration.')
        res.status(500).render("account/register", {
            title: "Registration",
            nav,
            errors: null,
        })
    }
    const regResult = await accountModel.registerAccount(
        account_firstname,
        account_lastname,
        account_email,
        hashedPassword
    )

    if (regResult) {
        req.flash(
            "notice",
            `Congratulations, you\'re registered ${account_firstname}. Please log in.`
        )
        res.status(201).render("account/login", {
            title: "Login",
            nav,
            errors: null
        })
    } else {
        req.flash("notice", "Sorry, the registration failed.")
        res.status(501).render("account/register", {
            title: "Registration",
            nav,
            errors: null
        })
    }
}

/* ****************************************
 *  Process login request
 * ************************************ */
accountController.accountLogin = async function (req, res) {
    let nav = await utilities.getNav()
    const { account_email, account_password } = req.body
    const accountData = await accountModel.getAccountByEmail(account_email)
    if (!accountData) {
        req.flash("notice", "Please check your credentials and try again.")
        res.status(400).render("account/login", {
            title: "Login",
            nav,
            errors: null,
            account_email,
        })
        return
    }
    try {
        if (await bcrypt.compare(account_password, accountData.account_password)) {
            delete accountData.account_password
            const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
            if (process.env.NODE_ENV === 'development') {
                res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
            } else {
                res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
            }
            return res.redirect("/account/")
        }
        else {
            req.flash("message notice", "Please check your credentials and try again.")
            res.status(400).render("account/login", {
                title: "Login",
                nav,
                errors: null,
                account_email,
            })
        }
    } catch (error) {
        throw new Error('Access Forbidden')
    }
}

/* ****************************************
 *  Process logout
 * ************************************ */
accountController.logout = async function (req, res) {
    // Clear cookies
    res.clearCookie("jwt");
    res.clearCookie("sessionId");

    await req.flash("notice", "You have been logged out.");
    res.redirect("/");
};


/* ****************************************
*  Edit account
* *************************************** */
accountController.updateAccount = async function (req, res) {
    try {
        const allowedFields = [
            "account_firstname",
            "account_lastname",
            "account_email",
            "account_password"
        ]

        const newData = {
            ...res.locals.accountData,
            ...req.body
        }

        // Filters out fields from the request body that won't be used for account processing. ACCOUNT ID IS NOT INCLUDED
        const newAccountData = Object.fromEntries(
            Object.entries(newData).filter(([key]) =>
                allowedFields.includes(key)
            )
        )

        // Hash the password if a new one was sent.
        if (req.body.account_password) newAccountData.account_password = bcrypt.hashSync(req.body.account_password, 10)

        // Assigning the account ID here prevents the client from overriding the ID.
        const account_id = res.locals.accountData.account_id;
        const {
            account_firstname,
            account_lastname,
            account_email,
            account_password,
        } = newAccountData;

        let accountResults = await accountModel.updateAccount(
            account_id,
            account_firstname,
            account_lastname,
            account_email,
            account_password ?? null,
        )
        delete accountResults.account_password;

        const accessToken = jwt.sign(accountResults, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
        if (process.env.NODE_ENV === 'development') {
            res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
        } else {
            res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
        }

        let accountName = `${accountResults.account_firstname} ${accountResults.account_lastname}`;

        req.flash("notice", `${accountName}'s account was successfully updated.`)
        res.redirect("/account/")
    } catch (err) {
        let accountName = `${res.locals.accountData.account_firstname} ${res.locals.accountData.account_lastname}`;

        await req.flash("error", `Sorry, the update failed for ${accountName}.`)
        res.redirect("/account/")
    }
}


accountController.updateAccountRole = async function (req, res) {
    try {
        const account_id = req.params.accountId;
        const { account_type } = req.body;


        let accountResults = await accountModel.updateAccountType(
            account_id,
            account_type,
        )
        delete accountResults.account_password;

        // If you updated your own role, it updates the access token.
        if (req.actorId == account_id) {
            const accessToken = jwt.sign(accountResults, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
            if (process.env.NODE_ENV === 'development') {
                res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
            } else {
                res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
            }
        }

        let accountName = `${accountResults.account_firstname} ${accountResults.account_lastname}`;

        await req.flash("notice", `${accountName}'s account role was successfully updated to ${account_type}`)
        res.redirect("/account/")
    } catch (err) {
        await req.flash("error", `Sorry, the role update failed.`)
        res.redirect("/account/")
    }
}


module.exports = accountController