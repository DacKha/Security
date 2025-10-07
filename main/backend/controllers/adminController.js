const jwt = require("jsonwebtoken");

// API login admin
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Kiểm tra username và password
    if (username !== "admin" || password !== "admin123") {
      return res.status(400).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    // Tạo token cho admin
    const token = jwt.sign(
      { role: "admin", username: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({ message: "Đăng nhập admin thành công", token });
  } catch (error) {
    console.error("❌ loginAdmin error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = { loginAdmin };
