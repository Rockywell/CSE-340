const utilities = require("../utilities/")
const invModel = require("../models/inventory-model")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
    const classification_id = req.params.classificationId;

    const data = await invModel.getInventoryByClassificationId(classification_id)
    const grid = await utilities.buildClassificationGrid(data)

    let nav = await utilities.getNav()

    const className = data[0].classification_name

    res.render("inventory/classification", {
        title: className + " vehicles",
        nav,
        grid,
        errors: null
    })
}

invCont.buildByInventoryId = async function (req, res, next) {
    const inventory_id = req.params.inventoryId;

    const data = await invModel.getItemByInventoryId(inventory_id);
    const grid = await utilities.buildItemDetails(data)

    let nav = await utilities.getNav()

    const itemYear = data.inv_year
    const itemModel = data.inv_model;
    const itemMake = data.inv_make;

    res.render("inventory/item", {
        title: `${itemYear} ${itemModel} ${itemMake}`,
        name: `${itemModel} ${itemMake}`,
        nav,
        grid,
        errors: null
    })
}

// Build the inventory manager view
invCont.buildManager = async function (req, res, next) {
    let nav = await utilities.getNav();

    res.render("inventory/management", {
        title: "Vehicle Management",
        nav,
        errors: null
    })
}


invCont.buildClassificationRegister = async function (req, res, next) {
    let nav = await utilities.getNav();

    res.render("inventory/add-classification", {
        title: "Add New Classification",
        nav,
        errors: null
    })
}

invCont.buildInventoryRegister = async function (req, res, next) {
    let classification_id = req?.body?.classification_id ?? null;
    const classificationSelect = await utilities.buildClassificationSelect(classification_id);

    let nav = await utilities.getNav();

    res.render("inventory/add-inventory", {
        title: "Add New Vehicle",
        nav,
        classificationSelect,
        errors: null
    })
}



/* ****************************************
*  Process New Classification
* *************************************** */
invCont.registerClassification = async function (req, res) {
    const { classification_name } = req.body

    const regResult = await invModel.registerClassification(
        classification_name
    )

    let nav = await utilities.getNav()

    if (regResult) {
        req.flash(
            "notice",
            `The classification "${classification_name}" has been added successfully.`
        )
        res.status(201).render("inventory/management", {
            title: "Vehicle Management",
            nav,
            errors: null
        })
    } else {
        // invCont.buildClassificationRegister(req, res)
        req.flash("notice", "Sorry, the registration failed.")
        res.status(501).render("inventory/add-classification", {
            title: "Add New Classification",
            nav,
            errors: null
        })
    }
}

/* ****************************************
*  Process New Inventory/Vehicle
* *************************************** */
invCont.registerInventory = async function (req, res) {
    let nav = await utilities.getNav()

    const { classification_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color } = req.body

    const regResult = await invModel.registerInventory(
        classification_id,
        inv_make,
        inv_model,
        inv_description,
        inv_image,
        inv_thumbnail,
        inv_price,
        inv_year,
        inv_miles,
        inv_color
    )


    if (regResult) {
        req.flash(
            "notice",
            `The vehicle "${inv_make}" has been added successfully.`
        )
        res.status(201).render("inventory/management", {
            title: "Vehicle Management",
            nav,
            errors: null
        })
    } else {
        req.flash("notice", "Sorry, the registration failed.")
        res.status(501)
        invCont.buildInventoryRegister(req, res)
        // res.status(501).render("inventory/add-inventory", {
        //     title: "Add New Vehicle",
        //     nav,
        //     classification_id,
        //     errors: null
        // })
    }
}


module.exports = invCont