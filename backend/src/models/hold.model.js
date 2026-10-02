const createHold = async (
    client,
    userId,
    productId,
    expiresAt
) => {

    const result = await client.query(
        `INSERT INTO holds (
            user_id,
            product_id,
            status,
            expires_at
        )
        VALUES ($1, $2, 'active', $3)
        RETURNING *`,
        [
            userId,
            productId,
            expiresAt
        ]
    );

    return result.rows[0];
};

const getExpiredHolds = async (client) => {
    const result = await client.query(
        `SELECT *
         FROM holds
         WHERE status = 'active'
         AND expires_at <= NOW()
         FOR UPDATE`
    );

    return result.rows;
};

const expireHold = async (client, holdId) => {
    const result = await client.query(
        `UPDATE holds
         SET status = 'expired'
         WHERE id = $1
         AND status = 'active'
         RETURNING *`,
        [holdId]
    );

    return result.rows[0];
};

const getHoldById = async (
    client,
    holdId
) => {
    const result = await client.query(
        `SELECT *
         FROM holds
         WHERE id = $1`,
        [holdId]
    );

    return result.rows[0];
};

const getActiveHoldByUser = async (
    client,
    userId
) => {
    const result = await client.query(
        `SELECT *
         FROM holds
         WHERE user_id = $1
         AND status = 'active'
         LIMIT 1`,
        [userId]
    );

    return result.rows[0];
};

const markHoldAsPaid = async (
    client,
    holdId
) => {
    const result = await client.query(
        `UPDATE holds
         SET status = 'paid',
             paid_at = NOW()
         WHERE id = $1
         AND status = 'active'
         RETURNING *`,
        [holdId]
    );

    return result.rows[0];
};

export {
    createHold,
    getExpiredHolds,
    expireHold,
    getHoldById,
    getActiveHoldByUser,
    markHoldAsPaid
};