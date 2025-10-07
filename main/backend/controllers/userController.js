const { sql, poolPromise } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { name, email, cccd, password } = req.body;

  try {
    const pool = await poolPromise;

    // Kiểm tra email đã tồn tại
    const existingUser = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE Email = @email");

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: "Email đã được đăng ký" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm user mới vào DB
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.VarChar, email)
      .input("cccd", sql.VarChar, cccd)
      .input("password", sql.VarChar, hashedPassword).query(`
        INSERT INTO Users (Name, Email, CCCD, Password)
        VALUES (@name, @email, @cccd, @password)
      `);

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    console.error("❌ registerUser error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE Email = @email");

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const token = jwt.sign(
      { id: user.ID, email: user.Email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    console.error("❌ loginUser error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = { registerUser, loginUser };
