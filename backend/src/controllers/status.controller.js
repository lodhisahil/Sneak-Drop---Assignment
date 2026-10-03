import pool from "../config/db.js";

import { findOrCreateUser } from "../models/user.model.js";

import {
    getAvailableStock
} from "../models/product.model.js";

import {
    getActiveHoldByUser
} from "../models/hold.model.js";

import {
    getUserWaitlistPosition
} from "../models/waitlist.model.js";

import {
    getPaidOrderCountByUser,
    getPendingOrderByHoldId
} from "../models/order.model.js";

const getSaleStatus = async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            userId,
            productId
        } = req.query;

        if (!userId || !productId) {

            return res.status(400).json({
                success: false,
                message: "userId and productId are required"
            });

        }

        await client.query("BEGIN");

        // Find existing user
        const user = await findOrCreateUser(
            client,
            userId
        );

        // Get available stock
        const product = await getAvailableStock(
            client,
            productId
        );

        if (!product) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });

        }

        // Get active hold
        const activeHold = await getActiveHoldByUser(
            client,
            user.id
        );

        let pendingOrder = null;

        if (activeHold) {

            pendingOrder = await getPendingOrderByHoldId(
                client,
                activeHold.id
            );

        }

        // Get waitlist position
        const waitlistEntry =
            await getUserWaitlistPosition(
                client,
                user.id,
                productId
            );

        // Get paid order count
        const paidOrderCount =
            await getPaidOrderCountByUser(
                client,
                user.id
            );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            data: {
                availableStock: product.available_stock,

                hold: activeHold ? {
                    ...activeHold,
                    orderId: pendingOrder?.id || null
                }
                : null,

                waitlist: waitlistEntry
                    ? {
                        position: waitlistEntry.position
                    }
                    : null,

                paidOrders: paidOrderCount
            }
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Sale status error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch sale status"
        });

    } finally {

        client.release();

    }
};


export {
    getSaleStatus
};