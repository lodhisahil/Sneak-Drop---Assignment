import express from "express";
import { handlePaymentEvent } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/event", handlePaymentEvent);

export default router;