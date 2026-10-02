const addToWaitlist = async (
    client,
    userId,
    productId
) => {

    const result = await client.query(
        `INSERT INTO waitlist (
            user_id,
            product_id,
            status
        )
        VALUES ($1, $2, 'waiting')
        RETURNING *`,
        [
            userId,
            productId
        ]
    );

    return result.rows[0];
};

const getFirstWaitingUser = async (
    client,
    productId
) => {
    const result = await client.query(
        `SELECT *
         FROM waitlist
         WHERE product_id = $1
         AND status = 'waiting'
         ORDER BY position ASC
         LIMIT 1
         FOR UPDATE`,
        [productId]
    );

    return result.rows[0];
};

const promoteWaitlistUser = async (
    client,
    waitlistId
) => {
    const result = await client.query(
        `UPDATE waitlist
         SET status = 'promoted',
             promoted_at = NOW()
         WHERE id = $1
         AND status = 'waiting'
         RETURNING *`,
        [waitlistId]
    );

    return result.rows[0];
};

const getActiveWaitlistEntry = async (
    client,
    userId,
    productId
) => {
    const result = await client.query(
        `SELECT *
         FROM waitlist
         WHERE user_id = $1
         AND product_id = $2
         AND status = 'waiting'
         LIMIT 1`,
        [
            userId,
            productId
        ]
    );

    return result.rows[0];
};

const getWaitingUsers = async (
    client,
    productId
) => {
    const result = await client.query(
        `SELECT *
         FROM waitlist
         WHERE product_id = $1
         AND status = 'waiting'
         ORDER BY position ASC
         FOR UPDATE`,
        [productId]
    );

    return result.rows;
};

const getUserWaitlistPosition = async (
    client,
    userId,
    productId
) => {

    const result = await client.query(
        `SELECT position
         FROM (
             SELECT
                 id,
                 user_id,
                 ROW_NUMBER() OVER (
                     ORDER BY position ASC
                 ) AS position
             FROM waitlist
             WHERE product_id = $1
             AND status = 'waiting'
         ) AS queue
         WHERE user_id = $2`,
        [
            productId,
            userId
        ]
    );

    return result.rows[0];
};

export {
    addToWaitlist,
    getFirstWaitingUser,
    promoteWaitlistUser,
    getActiveWaitlistEntry,
    getWaitingUsers,
    getUserWaitlistPosition
};