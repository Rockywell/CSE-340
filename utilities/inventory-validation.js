const utilities = require(".")
const { body, validationResult } = require("express-validator")
const inventoryModel = require("../models/inventory-model")


const validate = {}


/*  **********************************
  *  Registration Data Validation Rules
  * ********************************* */
validate.classificationRules = () => {
    return [
        // A classification name is required and must be string
        body("classification_name")
            .trim()
            .escape()
            .notEmpty()
            .isAlpha()
            .withMessage("Please provide a correct classification name.") // on error this message is sent.
            .custom(async (classification_name) => {
                const classificationExists = await inventoryModel.checkExistingClassification(classification_name)
                if (classificationExists) {
                    throw new Error("Classification exists. Please use a different classification")
                }
            }),
    ]
}

validate.inventoryRules = () => {
    let currentYear = new Date().getFullYear();
    return [
        body("classification_id")
            .trim()
            .notEmpty()
            .withMessage("Classification is required.")
            .isInt({ min: 1 })
            .withMessage("Classification must be a valid selection."),

        body("inv_make")
            .trim()
            .notEmpty()
            .withMessage("Make is required.")
            .isLength({ min: 3 })
            .withMessage("Make must be at least 3 characters long."),

        body("inv_model")
            .trim()
            .notEmpty()
            .withMessage("Model is required.")
            .isLength({ min: 3 })
            .withMessage("Model must be at least 3 characters long."),

        body("inv_description")
            .trim()
            .notEmpty()
            .withMessage("Description is required."),

        body("inv_image")
            .trim()
            .notEmpty()
            .withMessage("Image path is required.")
            .matches(/.*\.(jpg|jpeg|png|gif|webp)$/i)
            .withMessage("Image path must end in .jpg, .jpeg, .png, .gif, or .webp")
            .custom(async (imagePath) => {
                const imageExists = await utilities.publicFileExists(imagePath)
                if (!imageExists) {
                    throw new Error("This image does not exist. Please use a different image path.")
                }
            }),

        body("inv_thumbnail")
            .trim()
            .notEmpty()
            .withMessage("Thumbnail path is required.")
            .matches(/.*\.(jpg|jpeg|png|gif|webp)$/i)
            .withMessage("Thumbnail path must end in .jpg, .jpeg, .png, .gif, or .webp")
            .custom(async (imagePath) => {
                const imageExists = await utilities.publicFileExists(imagePath)
                if (!imageExists) {
                    throw new Error("This thumbnail does not exist. Please use a different thumbnail path.")
                }
            }),

        body("inv_price")
            .trim()
            .notEmpty()
            .withMessage("Price is required.")
            .isFloat({ min: 0 })
            .withMessage("Price must be a number and cannot be negative."),

        body("inv_year")
            .trim()
            .notEmpty()
            .withMessage("Year is required.")
            .isInt({ min: 1885, max: currentYear })
            .withMessage(`Year must be a 4 - digit number between 1885 and ${currentYear}.`),

        body("inv_miles")
            .trim()
            .notEmpty()
            .withMessage("Miles is required.")
            .isInt({ min: 0 })
            .withMessage("Miles must be a positive integer."),

        body("inv_color")
            .trim()
            .notEmpty()
            .withMessage("Color is required.")
            .matches(/^[A-Za-z ]+$/)
            .withMessage("Color must contain only letters and spaces."),
    ];
};

validate.newInventoryRules = () => [
    body("inv_id")
        .trim()
        .notEmpty()
        .withMessage("ID is required.")
        .withMessage("Make must be at least 3 characters long.")
        .isInt({ min: 1 })
        .withMessage("ID must be a valid selection."),
    ...validate.inventoryRules()
];



/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkClassificationData = async (req, res, next) => {
    const { classification_name } = req.body
    let errors = []
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        res.render("inventory/add-classification", {
            errors,
            title: "Add New Classification",
            nav,
            classification_name,
        })
        return
    }
    next()
}

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkInventoryData = async (req, res, next) => {
    const { classification_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color } = req.body
    let errors = []
    errors = validationResult(req)
    if (!errors.isEmpty()) {
        let nav = await utilities.getNav()
        const classificationSelect = await utilities.buildClassificationSelect(classification_id);

        res.render("inventory/add-inventory", {
            errors,
            title: "Add New Vehicle",
            nav,
            classification_id,
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color,
            classificationSelect
        })
        return
    }
    next()
}

/* ******************************
 * Check data and return errors or continue to the edit view
 * ***************************** */
validate.checkUpdateData = async (req, res, next) => {
    const { inv_id, classification_id, inv_make, inv_model, inv_description, inv_image, inv_thumbnail, inv_price, inv_year, inv_miles, inv_color } = req.body
    let errors = []
    errors = validationResult(req)
    if (!errors.isEmpty()) {

        let nav = await utilities.getNav()
        const classificationSelect = await utilities.buildClassificationSelect(classification_id);

        const itemName = `${inv_make} ${inv_model}`

        res.render("inventory/edit-inventory", {
            errors,
            title: `Edit ${itemName} Details`,
            nav,
            classification_id,
            inv_id,
            inv_make,
            inv_model,
            inv_description,
            inv_image,
            inv_thumbnail,
            inv_price,
            inv_year,
            inv_miles,
            inv_color,
            classificationSelect
        })
        return
    }
    next()
}

module.exports = validate