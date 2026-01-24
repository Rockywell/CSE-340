const invModel = require("../models/inventory-model")
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
 * Middleware For Handling Errors
 * Wrap other function in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = Util