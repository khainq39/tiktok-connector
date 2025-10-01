import express from "express";
import { shippingController } from "../../controllers/shippingController.js";

const router = express.Router();

// Đăng nhập Viettel Post
router.post("/login", shippingController.login);

// Lấy phí ship
router.post("/pricing", shippingController.getPrice);

// Tạo vận đơn
router.post("/create", shippingController.createOrder);

// Update vận đơn (cancel, confirm, re-order…)
router.post("/update", shippingController.updateOrder);

// Tracking đơn hàng
router.get("/track/:order_number", shippingController.trackOrder);

// Print label (POST, truyền ORDER_ARRAY)
router.post("/print", shippingController.printOrder);

export default router;
