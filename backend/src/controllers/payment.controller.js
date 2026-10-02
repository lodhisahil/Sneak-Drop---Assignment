import pool from "../config/db.js";
import {
    createPaymentEvent,
    getPaymentEventByEventId,
    markPaymentEventProcessed
} from "../models/paymentEvent.model.js";

import {
    getOrderById,
    markOrderAsPaid
} from "../models/order.model.js";

import {
    getHoldById,
    markHoldAsPaid
} from "../models/hold.model.js";

const handlePaymentEvent = async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const {
            eventId,
            paymentId,
            orderId,
            eventType,
            payload
        } = req.body;

        if (
            !eventId ||
            !paymentId ||
            !orderId ||
            !eventType
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Missing payment event fields"
            });
        }

        const existingEvent = await getPaymentEventByEventId(
            client,
            eventId
        );

        if (existingEvent) {

            await client.query("COMMIT");

            return res.status(200).json({
                success: true,
                message: "Payment event already processed",
                data: existingEvent
            });
        }

        const order = await getOrderById(
            client,
            orderId
        );

        if (!order) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const hold = await getHoldById(
            client,
            order.hold_id
        );

        if (!hold) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Hold not found"
            });
        }

        if (
            hold.status !== "active" ||
            new Date(hold.expires_at) <= new Date()
        ) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Hold has expired. Payment cannot be completed."
            });
        }

        if (eventType !== "payment.success") {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Unsupported payment event"
            });
        }

        const paidOrder = await markOrderAsPaid(
            client,
            orderId
        );

        if (!paidOrder) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Order is already processed or cannot be paid"
            });
        }

        const paidHold = await markHoldAsPaid(
            client,
            order.hold_id
        );

        if (!paidHold) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Hold is already processed or cannot be marked as paid"
            });
        }

        const paymentEvent = await createPaymentEvent(
            client,
            eventId,
            paymentId,
            orderId,
            eventType,
            payload || {}
        );

        if (!paymentEvent) {

            const existingEvent = await getPaymentEventByEventId(
                client,
                eventId
            );

            await client.query("COMMIT");

            return res.status(200).json({
                success: true,
                message: "Payment event already processed",
                data: existingEvent
            });
        }

        const processedEvent = await markPaymentEventProcessed(
            client,
            eventId
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Payment event received",
            data: processedEvent
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Payment event error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to process payment event"
        });

    } finally {

        client.release();

    }
};

export {
    handlePaymentEvent
};