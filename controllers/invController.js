const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId
    const data = await invModel.getInventoryByClassificationId(classification_id)
    const grid = await utilities.buildClassificationGrid(data)

    let nav = await utilities.getNav()

    const className = data[0].classification_name

    res.render("./inventory/classification", {
        title: className + " vehicles",
        nav,
        grid,
    })
}

invCont.buildByInventoryId = async function (req, res, next) {
    const inventory_id = req.params.inventoryId
    const data = await invModel.getItemByInventoryId(inventory_id)
    const grid = await utilities.buildItemDetails(data)

    let nav = await utilities.getNav()

    const itemYear = data.inv_year
    const itemModel = data.inv_model;
    const itemMake = data.inv_make;

    res.render("./inventory/item", {
        title: `${itemYear} ${itemModel} ${itemMake}`,
        name: `${itemModel} ${itemMake}`,
        nav,
        grid,
    })
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

module.exports = invCont