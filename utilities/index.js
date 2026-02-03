const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs/promises")

const invModel = require("../models/inventory-model")
require("dotenv").config()

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
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

// {
//   inv_id: 2,
//   inv_make: "Batmobile",
//   inv_model: "Custom",
//   inv_year: "2007",
//   inv_description: "Ever want to be a super hero? now you can with the batmobile. This car allows you to switch to bike mode allowing you to easily maneuver through traffic during rush hour.",
//   inv_image: "/images/vehicles/batmobile.jpg",
//   inv_thumbnail: "/images/vehicles/batmobile-tn.jpg",
//   inv_price: "65000",
//   inv_miles: 29887,
//   inv_color: "Black",
//   classification_id: 1,
// }


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


/* ****************************************
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = Util