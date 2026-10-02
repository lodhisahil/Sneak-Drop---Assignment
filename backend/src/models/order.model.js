const createOrder = async (
    client,
    userId,
    productId,
    holdId
) => {

    const result = await client.query(
        `INSERT INTO orders (
            user_id,
            product_id,
            hold_id,
            status
        )
        VALUES ($1, $2, $3, 'pending')
        RETURNING *`,
        [
            userId,
            productId,
            holdId
        ]
    );

    return result.rows[0];
};

const getOrderById = async (
    client,
    orderId
) => {
    const result = await client.query(
        `SELECT *
         FROM orders
         WHERE id = $1`,
        [orderId]
    );

    return result.rows[0];
};

const markOrderAsPaid = async (
    client,
    orderId
) => {
    const result = await client.query(
        `UPDATE orders
         SET status = 'paid',
             paid_at = NOW()
         WHERE id = $1
         AND status = 'pending'
         RETURNING *`,
        [orderId]
    );

    return result.rows[0];
};

const getPaidOrderCountByUser = async (
    client,
    userId
) => {
    const result = await client.query(
        `SELECT COUNT(*) AS count
         FROM orders
         WHERE user_id = $1
         AND status = 'paid'`,
        [userId]
    );

    return Number(result.rows[0].count);
};

const expireOrderByHoldId = async (
    client,
    holdId
) => {
    const result = await client.query(
        `UPDATE orders
         SET status = 'expired'
         WHERE hold_id = $1
         AND status = 'pending'
         RETURNING *`,
        [holdId]
    );

    return result.rows[0];
};

const getPendingOrderByHoldId = async (
    client,
    holdId
) => {
    const result = await client.query(
        `SELECT *
         FROM orders
         WHERE hold_id = $1
         AND status = 'pending'
         LIMIT 1`,
        [holdId]
    );

    return result.rows[0];
};

export {
    createOrder,
    getOrderById,
    markOrderAsPaid,
    getPaidOrderCountByUser,
    expireOrderByHoldId,
    getPendingOrderByHoldId
};