const express = require("express");
const { loginAdmin } = require("../controllers/adminController");
const router = express.Router();

// API đăng nhập admin
router.post("/login", loginAdmin);
module.exports = router;
