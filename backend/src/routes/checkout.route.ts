import express from "express";
import { createCheckout } from "../controllers/checkout.controller";



const router = express.Router();

router.post("/", createCheckout)

export default router; 