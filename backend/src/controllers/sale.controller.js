import pool from "../config/db.js";
import { findOrCreateUser } from "../models/user.model.js";
import {
    lockProduct,
    decreaseStock
} from "../models/product.model.js";
import {
    createHold,
    getActiveHoldByUser
} from "../models/hold.model.js";
import {
    createOrder,
    getPaidOrderCountByUser
} from "../models/order.model.js";
import { addToWaitlist, getActiveWaitlistEntry } from "../models/waitlist.model.js";


const buySneaker = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: "userId and productId are required",
            });
        }

        const user = await findOrCreateUser(client, userId);

        const activeHold = await getActiveHoldByUser(
            client,
            user.id
        );

        if (activeHold) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "User already has an active hold",
                data: {
                    hold: activeHold
                }
            });
        }

        const paidOrderCount = await getPaidOrderCountByUser(
            client,
            user.id
        );

        if (paidOrderCount >= 2) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "User has already purchased the maximum of 2 pairs"
            });
        }

        const product = await lockProduct(client, productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.available_stock <= 0) {

            const existingEntry = await getActiveWaitlistEntry(
                client,
                user.id,
                product.id
            );

            if (existingEntry) {
                await client.query("COMMIT");

                return res.status(200).json({
                    success: true,
                    message: "User is already in the waitlist",
                    data: {
                        waitlist: existingEntry
                    }
                });
            }

            const waitlistEntry = await addToWaitlist(
                client,
                user.id,
                product.id
            );

            await client.query("COMMIT");

            return res.status(200).json({
                success: true,
                message: "Sneaker is out of stock. User added to waitlist.",
                data: {
                    waitlist: waitlistEntry
                }
            });
        }

        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        const hold = await createHold(
            client,
            user.id,
            product.id,
            expiresAt
        );

        const updatedProduct = await decreaseStock(
            client,
            product.id
        );

        const order = await createOrder(
            client,
            user.id,
            product.id,
            hold.id
        );


        console.log("User:", user);
        console.log("Product:", product);
        console.log("Hold:", hold);
        console.log("Updated Product:", updatedProduct);
        console.log("Order:", order);

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "User processed successfully",
            data: {
                user,
                product: updatedProduct,
                hold,
                order
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    } finally {
        client.release();
    }
};

export { buySneaker };
