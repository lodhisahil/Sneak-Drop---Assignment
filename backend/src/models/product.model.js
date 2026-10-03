import pool from "../config/db.js";

const getProductById = async (productId) => {
    const result = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [productId]
    );

    return result.rows[0];
};

const getAvailableStock = async (client, productId) => {
    const result = await client.query(
        `SELECT available_stock
         FROM products
         WHERE id = $1`,
        [productId]
    );

    return result.rows[0];
};

const lockProduct = async (client, productId) => {
    const result = await client.query(
        `SELECT *
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [productId]
    );

    return result.rows[0];
};

const decreaseStock = async (client, productId) => {
    const result = await client.query(
        `UPDATE products
         SET available_stock = available_stock - 1
         WHERE id = $1
         RETURNING *`,
        [productId]
    );

    return result.rows[0];
};

const increaseStock = async (client, productId) => {
    const result = await client.query(
        `UPDATE products
         SET available_stock = available_stock + 1
         WHERE id = $1
         RETURNING *`,
        [productId]
    );

    return result.rows[0];
};

export {
    getProductById,
    getAvailableStock,
    lockProduct,
    decreaseStock,
    increaseStock
};