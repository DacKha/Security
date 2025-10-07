// backend/routes/userRoutes.js
const express = require("express");
const { registerUser, loginUser } = require("../controllers/userController");

const router = express.Router();

// API đăng ký user
router.post("/register", registerUser);

// API đăng nhập
router.post("/login", loginUser);

module.exports = router;
