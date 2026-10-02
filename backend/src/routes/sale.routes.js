import express from "express";
import { buySneaker } from "../controllers/sale.controller.js";

import {
    getSaleStatus
} from "../controllers/status.controller.js";

const router = express.Router();

router.post("/buy", buySneaker);
router.get("/status", getSaleStatus)

export default router;