import pool from "../config/db.js";

import {
    getExpiredHolds,
    expireHold,
    getActiveHoldByUser
} from "../models/hold.model.js";

import { increaseStock } from "../models/product.model.js";

import {
    getWaitingUsers,
    promoteWaitlistUser
} from "../models/waitlist.model.js";

import { createHold } from "../models/hold.model.js";

import {
    createOrder,
    expireOrderByHoldId,
    getPaidOrderCountByUser
} from "../models/order.model.js";


const startExpiryWorker = () => {

    setInterval(async () => {

        const client = await pool.connect();

        try {

            await client.query("BEGIN");

            const expiredHolds = await getExpiredHolds(client);

            for (const hold of expiredHolds) {

                // 1. Expire the old hold
                await expireHold(
                    client,
                    hold.id
                );

                // 2. Expire the pending order
                await expireOrderByHoldId(
                    client,
                    hold.id
                );

                // 3. Get all waiting users in FIFO order
                const waitingUsers = await getWaitingUsers(
                    client,
                    hold.product_id
                );

                let promotedUser = null;

                // 4. Find the first eligible user
                for (const waitingUser of waitingUsers) {

                    // Check lifetime purchase limit
                    const paidOrderCount =
                        await getPaidOrderCountByUser(
                            client,
                            waitingUser.user_id
                        );

                    if (paidOrderCount >= 2) {
                        continue;
                    }

                    // Check active hold
                    const activeHold =
                        await getActiveHoldByUser(
                            client,
                            waitingUser.user_id
                        );

                    if (activeHold) {
                        continue;
                    }

                    // 5. Promote eligible user
                    await promoteWaitlistUser(
                        client,
                        waitingUser.id
                    );

                    // 6. Create new 5-minute hold
                    const expiresAt = new Date(
                        Date.now() + 5 * 60 * 1000
                    );

                    const newHold = await createHold(
                        client,
                        waitingUser.user_id,
                        hold.product_id,
                        expiresAt
                    );

                    // 7. Create new pending order
                    const newOrder = await createOrder(
                        client,
                        waitingUser.user_id,
                        hold.product_id,
                        newHold.id
                    );

                    promotedUser = waitingUser;

                    console.log(
                        "Waitlist user promoted:",
                        waitingUser.user_id
                    );

                    console.log(
                        "New hold created:",
                        newHold
                    );

                    console.log(
                        "New order created:",
                        newOrder
                    );

                    // Only one user gets this sneaker
                    break;
                }

                // 8. Nobody eligible → return sneaker to stock
                if (!promotedUser) {

                    await increaseStock(
                        client,
                        hold.product_id
                    );

                    console.log(
                        `Hold ${hold.id} expired and stock returned`
                    );

                }
            }

            await client.query("COMMIT");

        } catch (error) {

            await client.query("ROLLBACK");

            console.error(
                "Expiry worker error:",
                error.message
            );

        } finally {

            client.release();

        }

    }, 5000);
};


export {
    startExpiryWorker
};