import express from "express";
import { createStreamToken } from "../controllers/stream.controller";

const router = express.Router();

router.post('/token', createStreamToken);


export default router