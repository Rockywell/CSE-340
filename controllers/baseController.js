const utilities = require("../utilities/")
const baseController = {}

baseController.buildHome = async function (req, res) {
    const nav = await utilities.getNav()
    res.render("index", { title: "Home", nav, errors: null })
}

baseController.triggerError = async function (req, res, next) {
    const err = new Error("Intentional 500 status error.");
    err.status = 500;
    throw err;
};

module.exports = baseController