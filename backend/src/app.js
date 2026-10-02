import express from "express";
import cors from "cors";

import saleRoutes from "./routes/sale.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
const app = express();

app.use(cors());
app.use(express.json());


app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "SneakDrop API is running"
    });
});

app.use("/api/sale", saleRoutes);
app.use("/api/payment", paymentRoutes);

export default app;