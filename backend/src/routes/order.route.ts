import express from "express"
import { createStreamChannel, createVideoInvite, getOrder, listOrders } from "../controllers/order.controller";


const router = express.Router()

router.get("/", listOrders);
router.get("/:id", getOrder);
router.post("/:id/stream-channel", createStreamChannel);
router.post("/:id/video-invite", createVideoInvite);

export default router