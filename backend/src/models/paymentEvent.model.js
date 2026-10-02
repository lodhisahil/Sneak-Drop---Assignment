const createPaymentEvent = async (
    client,
    eventId,
    paymentId,
    orderId,
    eventType,
    payload
) => {
    const result = await client.query(
        `INSERT INTO payment_events (
            event_id,
            payment_id,
            order_id,
            event_type,
            payload
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (event_id)
        DO NOTHING
        RETURNING *`,
        [
            eventId,
            paymentId,
            orderId,
            eventType,
            payload
        ]
    );

    return result.rows[0];
};

const getPaymentEventByEventId = async (
    client,
    eventId
) => {
    const result = await client.query(
        `SELECT *
         FROM payment_events
         WHERE event_id = $1`,
        [eventId]
    );

    return result.rows[0];
};

const markPaymentEventProcessed = async (
    client,
    eventId
) => {
    const result = await client.query(
        `UPDATE payment_events
         SET processed_at = NOW()
         WHERE event_id = $1
         RETURNING *`,
        [eventId]
    );

    return result.rows[0];
};

export {
    createPaymentEvent,
    getPaymentEventByEventId,
    markPaymentEventProcessed
};