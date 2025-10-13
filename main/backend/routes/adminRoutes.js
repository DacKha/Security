import express from "express";
import { loginAdmin } from "../controllers/adminController.js";
const router = express.Router();

// API đăng nhập admin
router.post("/login", loginAdmin);
export default router;
