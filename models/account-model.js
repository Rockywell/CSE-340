const pool = require("../database/")
const bcrypt = require("bcryptjs");


/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
    try {
        const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *"
        return await pool.query(sql, [account_firstname, account_lastname, account_email, account_password])
    } catch (error) {
        throw error.message
    }
}

/* *****************************
*   Edit account
* *************************** */
async function updateAccount(account_id, account_firstname, account_lastname, account_email, account_password = null) {
    const values = [account_firstname, account_lastname, account_email];
    const setClauses = [
        "account_firstname = $1",
        "account_lastname = $2",
        "account_email = $3"
    ];

    //Includes account_password if defined.
    if (account_password !== null) {
        values.push(account_password);
        setClauses.push(`account_password = $${values.length}`);
    }

    values.push(account_id);

    try {
        const sql = `
            UPDATE public.account
            SET ${setClauses.join(", ")}
            WHERE account_id = $${values.length}
            RETURNING *
        `;
        const data = await pool.query(sql, values)
        return data.rows[0];
    } catch (error) {
        throw error.message
    }
}


/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email) {
    try {
        const sql = "SELECT * FROM account WHERE account_email = $1"
        const email = await pool.query(sql, [account_email])
        return email.rowCount >= 1
    } catch (error) {
        throw error.message
    }
}

/* **********************
 *   Check for existing email
 *   - If an ID is provided checks if that email exists with that ID.
 * ********************* */
async function checkExistingEmail(account_email, account_id = null) {
    try {
        const sql = "SELECT account_id FROM account WHERE account_email = $1 LIMIT 1";
        const email = await pool.query(sql, [account_email]);

        // Email doesn't exist.
        if (email.rowCount === 0) return false;

        // Don't check exact account if an ID isn't provided.
        if (account_id == null) return true;

        // Checks if the match has the same ID.
        const foundId = email.rows[0].account_id;

        return String(foundId) === String(account_id);
    } catch (error) {
        throw error;
    }
}

/* **********************
 *   Check for existing password
 * ********************* */
async function checkExistingPassword(account_id, plainPassword) {
    try {
        const sql = "SELECT account_password FROM account WHERE account_id = $1";
        const password = await pool.query(sql, [account_id]);

        if (password.rowCount === 0) {
            return false; // User not found
        }

        const hash = password.rows[0].account_password;

        // Compare plain password with hash
        return await bcrypt.compare(plainPassword, hash);
    } catch (error) {
        throw error.message;
    }
}


/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail(account_email) {
    try {
        const result = await pool.query(
            'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_email = $1',
            [account_email])
        return result.rows[0]
    } catch (error) {
        return new Error("No matching email found")
    }
}

/* *****************************
 * Return account data using account id
 * ***************************** */
async function getAccountById(account_id) {
    try {
        const result = await pool.query(
            `SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password
       FROM account
       WHERE account_id = $1`,
            [account_id]
        );
        return result.rows[0];
    } catch (error) {
        return new Error("No matching account id found");
    }
}



module.exports = { registerAccount, updateAccount, checkExistingEmail, checkExistingPassword, getAccountByEmail, getAccountById };