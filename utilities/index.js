const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs/promises")

const invModel = require("../models/inventory-model")
const accountModel = require("../models/account-model")
require("dotenv").config()

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const ROLE_HIERARCHY = {
    Admin: 3,
    Employee: 2,
    Client: 1
};

const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
    let data = await invModel.getClassifications()
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'
    data.rows.forEach((row) => {
        list += "<li>"
        list +=
            '<a href="/inv/type/' +
            row.classification_id +
            '" title="See our inventory of ' +
            row.classification_name +
            ' vehicles">' +
            row.classification_name +
            "</a>"
        list += "</li>"
    })
    list += "</ul>"
    return list
}

/* **************************************
* Build the classification view HTML
* ************************************ */
Util.buildClassificationGrid = async function (data) {
    let grid
    if (data.length > 0) {
        grid = '<ul id="inv-display">'
        data.forEach(vehicle => {
            grid += '<li>'
            grid += '<a href="../../inv/detail/' + vehicle.inv_id
                + '" title="View ' + vehicle.inv_make + ' ' + vehicle.inv_model
                + 'details"><img src="' + vehicle.inv_thumbnail
                + '" alt="Image of ' + vehicle.inv_make + ' ' + vehicle.inv_model
                + ' on CSE Motors" /></a>'
            grid += '<div class="namePrice">'
            grid += '<hr />'
            grid += '<h2>'
            grid += '<a href="../../inv/detail/' + vehicle.inv_id + '" title="View '
                + vehicle.inv_make + ' ' + vehicle.inv_model + ' details">'
                + vehicle.inv_make + ' ' + vehicle.inv_model + '</a>'
            grid += '</h2>'
            grid += '<span>$'
                + new Intl.NumberFormat('en-US').format(vehicle.inv_price) + '</span>'
            grid += '</div>'
            grid += '</li>'
        })
        grid += '</ul>'
    } else {
        grid += '<p class="notice">Sorry, no matching vehicles could be found.</p>'
    }
    return grid
}

/* **************************************
* Build the item view HTML
* ************************************ */
Util.buildItemDetails = async function (item) {
    let grid
    if (item && Object.keys(item).length > 0) {
        grid = '<div class="item-details">'

        grid += '<img src="' + item.inv_image
            + '" alt="Image of ' + item.inv_make + ' ' + item.inv_model
            + ' on CSE Motors" >'


        grid += '<div class="item-details-info">';
        grid += '<h2>' + item.inv_make + ' ' + item.inv_model + ' Details</h2>';
        grid += '<dl class="details-list">';

        grid += '<div class="detail-row"><dt>Price</dt><dd><b>$'
            + new Intl.NumberFormat("en-US").format(item.inv_price) + '</b></dd></div>';

        grid += '<div class="detail-row"><dt>Description</dt><dd>' + item.inv_description + '</dd></div>';

        grid += '<div class="detail-row"><dt>Color</dt><dd>' + item.inv_color + '</dd></div>';

        grid += '<div class="detail-row"><dt>Miles</dt><dd>'
            + new Intl.NumberFormat("en-US").format(item.inv_miles) + '</dd></div>';

        grid += '</dl></div>'

        grid += '</div>'
    } else {
        grid += '<p class="notice">Sorry, this vehicle could not be found.</p>'
    }
    return grid
}

/* **************************************
* Builds the select form element from provided classifications in HTML.
* ************************************ */
Util.buildClassificationSelect = async function (classification_id = null) {
    const data = await invModel.getClassifications();

    let select = '<label for="classificationList">Classification</label><select name="classification_id" id="classificationList" required>'
    select += '<option value="">Choose a Classification</option>'

    data.rows.forEach((row) => {
        const isSelected = row.classification_id == classification_id ? 'selected' : '';
        select += `<option value="${row.classification_id}" ${isSelected}>${row.classification_name}</option>`
    })

    select += '</select>'

    return select
}

/* **************************************
* Builds the select element from database accounts in HTML.
* ************************************ */
Util.buildAccountSelect = async function (account_id = null) {
    const data = await accountModel.getAccounts()

    const userAccount = data.rows.find(a => String(a.account_id) === String(account_id));


    const userRoleLevel = ROLE_HIERARCHY[userAccount.account_type];
    let acessibleAccounts = data.rows.filter(({ account_type }) => (ROLE_HIERARCHY[account_type] ?? 0) <= userRoleLevel);


    let select = '<label for="accountList">Accounts</label><select name="account_id" id="accountList" required>'
    select += '<option value="">Select an account</option>'

    acessibleAccounts.forEach((account) => {
        const isSelected = account.account_id == account_id ? 'selected' : '';
        select += `<option value="${account.account_id}" ${isSelected}>${account.account_firstname} ${account.account_lastname}</option>`
    })

    select += '</select>'

    return select
}

/* **************************************
* Builds the select element from database account_types in HTML.
* ************************************ */
Util.buildAccountTypeSelect = async function (account_type = null, selectedAccountType = null) {
    const roles = await accountModel.getAccountTypes();

    const roleLevel = ROLE_HIERARCHY[account_type] ?? 3

    const accessibleRoles = roles.filter(role => (ROLE_HIERARCHY[role] ?? 0) <= roleLevel);

    let select = '<label for="accountTypeList">Account Type</label><select name="account_type" id="accountTypeList" required>'
    select += '<option value="">Select an account type</option>'

    accessibleRoles.forEach((role) => {
        const isSelected = role == selectedAccountType ? 'selected' : '';
        select += `<option value="${role}" ${isSelected}>${role}</option>`
    })

    select += '</select>'

    return select
}


/* ****************************************
* Middleware for retrieving/returning values
**************************************** */
Util.getTargetAccountId = function (req) {
    const id = req.params?.accountId ?? req.actorId;
    if (!id) throw new Error("Missing target account id");

    return id;
}


/* ****************************************
* Middleware for checking conditions
**************************************** */
Util.fileExists = async function (filePath) {
    try {
        await fs.access(filePath);
        return true
    }
    catch {
        return false;
    }
}

// Checks that the file exists on the server.
Util.publicFileExists = async function (filePath) {

    const relativePath = String(filePath).replace(/^\/+/, "");
    const fullPath = path.resolve(PUBLIC_DIR, relativePath);

    // block "../" escape
    if (!fullPath.startsWith(PUBLIC_DIR + path.sep)) return false;

    return await Util.fileExists(fullPath);
}

/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
        jwt.verify(
            req.cookies.jwt,
            process.env.ACCESS_TOKEN_SECRET,
            function (err, accountData) {
                if (err) {
                    req.flash("Please log in")
                    res.clearCookie("jwt")
                    return res.redirect("/account/login")
                }
                // Useful for validation and controller processes.
                req.actorId = accountData.account_id;

                res.locals.accountData = accountData
                res.locals.loggedin = 1
                next()
            })
    } else {
        next()
    }
}

/* ****************************************
 *  Check Login
 * ************************************ */
Util.checkLogin = (req, res, next) => {
    if (res.locals.loggedin) {
        next()
    } else {
        req.flash("notice", "Please log in.")
        return res.redirect("/account/login")
    }
}

Util.checkEmployeeOrAdmin = (req, res, next) => {
    const account = res.locals.accountData;


    if (!account) {
        req.flash("notice", "Please log in.");
        return res.status(401).redirect("/account/login")
    }

    const type = account.account_type;
    if (type === "Employee" || type === "Admin") return next();

    req.flash("notice", "You are not authorized to access that resource.");
    return res.status(403).redirect("/account/login")
};

/* ****************************************
 *  Checks if the first account_type has the permissions to access the specified target account type.
 * ************************************ */
Util.canAccessRole = async (userType, targetType = "Client") => {
    try {

        const accountTypes = await accountModel.getAccountTypes();

        const userRoleLevel = ROLE_HIERARCHY[userType] ?? 0;
        const accessibleRoles = accountTypes.filter(type => (ROLE_HIERARCHY[type] ?? 0) <= userRoleLevel)

        //Returns true if the provided account_type is one of the users allowed roles.
        return accessibleRoles.includes(String(targetType))
    } catch {
        return false
    }
}

/* ****************************************
 *  Checks if user has permisssions to edit a certain account
 * ************************************ */
Util.canEditUser = async (req, res, next) => {
    try {
        const currentUser = res.locals.accountData;

        if (!currentUser) {
            req.flash("notice", "Please log in.");
            return res.status(401).redirect("/account/login");
        }

        const targetAccount = await accountModel.getAccountById(req.params.accountId);

        if (!targetAccount) {
            req.flash("error", "Account not found.");
            return res.status(404).redirect(req.get("Referrer") || "/account/");
        }


        if (await Util.canAccessRole(currentUser.account_type, targetAccount.account_type)) {
            return next();
        }

        req.flash("notice", "You are not authorized to modify that account.");
        return res.status(403).redirect(req.get("Referrer") || "/account/");

    } catch (error) {
        return next(error);
    }
};



/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = Util