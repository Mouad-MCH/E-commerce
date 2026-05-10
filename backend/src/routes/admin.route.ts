import express from "express"
import { createAdminProduct, deleteAdminProduct, getImageKitAuth, listAdminProducts, requireAdmin, updateAdminProduct } from "../controllers/admin.controller"


const router = express.Router()

router.use(requireAdmin)

router.get('/imagekit/auth', getImageKitAuth)
router.get("/products", listAdminProducts);
router.post("/products", createAdminProduct);
router.patch("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

export default router