import express from "express";
import { getCategories, getProductBySlug, listProducts } from "../controllers/poduct.controller";


const router = express.Router();

router.get("/", listProducts)
router.get("/categories", getCategories)
router.get("/:slug", getProductBySlug)



export default router;