import { poolPromise } from "../config/db.js";
export const getCandidates = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Candidates");
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ứng viên" });
  }
};
