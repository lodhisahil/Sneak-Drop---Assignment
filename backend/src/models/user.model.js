const findOrCreateUser = async (client, externalId) => {

    const result = await client.query(
        `INSERT INTO users (external_id)
         VALUES ($1)
         ON CONFLICT (external_id)
         DO UPDATE SET external_id = EXCLUDED.external_id
         RETURNING *`,
        [externalId]
    );

    return result.rows[0];
};

export {
    findOrCreateUser
};