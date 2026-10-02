import "dotenv/config";
import app from "./app.js";
import pool from "./config/db.js";
import { startExpiryWorker } from "./workers/expiry.worker.js";


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await pool.query("SELECT NOW()");

        console.log("Database connected successfully");

        app.listen(PORT, () => {
            console.log(`SneakDrop server running on port ${PORT}`);
        });

        startExpiryWorker();

    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
};

startServer();

