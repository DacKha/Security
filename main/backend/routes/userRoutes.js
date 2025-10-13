import express from "express";
import {
  registerUser,
  loginUser,
  checkCccd,
  verifyOtp,
  sendOtp,
} from "../controllers/userController.js";
const router = express.Router();

// API gửi OTP xác thực email khi đăng ký cử tri
router.post("/send-otp", sendOtp);
// API xác thực OTP
router.post("/verify-otp", verifyOtp);
// API kiểm tra CCCD đã đăng ký chưa
router.post("/check-cccd", checkCccd);
// API đăng ký user
router.post("/register", registerUser);
// API đăng nhập
router.post("/login", loginUser);

export default router;
