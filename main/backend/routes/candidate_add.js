// routes/candidate.js
import express from "express";
import { poolPromise } from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

router.post("/add", async (req, res) => {
  const { name, team, age, level, adminAddress } = req.body;

  try {
    // Kiểm tra quyền admin
    const ADMIN_WALLET = process.env.ADMIN_ADDRESS; // TODO: thay bằng ví admin thực tế
    if (adminAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return res.status(403).json({ message: "Không có quyền thêm ứng viên!" });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("name", name)
      .input("team", team)
      .input("age", age)
      .input("level", level).query(`
        INSERT INTO Candidates (Name, Team, Age, Level)
        VALUES (@name, @team, @age, @level)
      `);

    res.json({ message: "Thêm ứng viên thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi thêm ứng viên" });
  }
});

export default router;
