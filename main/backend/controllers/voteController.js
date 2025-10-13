import { poolPromise, sql } from "../config/db.js";
import electionContract from "../config/blockchain.js";

// Lấy danh sách người đăng ký bầu cử (chưa duyệt + đã duyệt)
export const getVotes = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        VoterID,
        EmployeeID,
        WalletAddress,
        CitizenID,
        RegisteredAt,
        IsApproved
      FROM RegisteredVoters
      ORDER BY RegisteredAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length,
    });
  } catch (error) {
    console.error("❌ getVotes error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách người đăng ký bầu cử",
      error: error.message,
    });
  }
};

// Lấy danh sách chờ duyệt
export const getPendingVoters = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        rv.VoterID,
        rv.EmployeeID,
        rv.WalletAddress,
        rv.CitizenID,
        rv.RegisteredAt,
        rv.IsApproved,
        e.FullName AS EmployeeName,
        e.Email AS EmployeeEmail,
        e.Phone AS EmployeePhone
      FROM RegisteredVoters rv
      LEFT JOIN Employees e ON rv.EmployeeID = e.EmployeeID
      WHERE rv.IsApproved = 0
      ORDER BY rv.RegisteredAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length,
    });
  } catch (error) {
    console.error("❌ getPendingVoters error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách chờ duyệt",
      error: error.message,
    });
  }
};

// Lấy danh sách đã duyệt
export const getApprovedVoters = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        rv.VoterID,
        rv.EmployeeID,
        rv.WalletAddress,
        rv.CitizenID,
        rv.RegisteredAt,
        rv.IsApproved,
        e.FullName AS EmployeeName,
        e.Email AS EmployeeEmail,
        e.Phone AS EmployeePhone
      FROM RegisteredVoters rv
      LEFT JOIN Employees e ON rv.EmployeeID = e.EmployeeID
      WHERE rv.IsApproved = 1
      ORDER BY rv.RegisteredAt DESC
    `);

    res.json({
      success: true,
      data: result.recordset,
      total: result.recordset.length,
    });
  } catch (error) {
    console.error("❌ getApprovedVoters error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đã duyệt",
      error: error.message,
    });
  }
};

// Duyệt cử tri (approve)
export const approveVoter = async (req, res) => {
  const { voterIds } = req.body; // Array of VoterIDs hoặc single VoterID

  if (!voterIds || (Array.isArray(voterIds) && voterIds.length === 0)) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin VoterID",
    });
  }

  const ids = Array.isArray(voterIds) ? voterIds : [voterIds];

  try {
    const pool = await poolPromise;
    const approvedVoters = [];

    for (const voterId of ids) {
      // Kiểm tra voter tồn tại và chưa được duyệt
      const checkResult = await pool
        .request()
        .input("voterId", sql.Int, voterId)
        .query("SELECT * FROM RegisteredVoters WHERE VoterID = @voterId");

      if (checkResult.recordset.length === 0) {
        console.log(`⚠️ VoterID ${voterId} không tồn tại`);
        continue;
      }

      const voter = checkResult.recordset[0];

      if (voter.IsApproved === true || voter.IsApproved === 1) {
        console.log(`⚠️ VoterID ${voterId} đã được duyệt trước đó`);
        continue;
      }

      // Cập nhật IsApproved = 1
      await pool
        .request()
        .input("voterId", sql.Int, voterId)
        .query(
          "UPDATE RegisteredVoters SET IsApproved = 1 WHERE VoterID = @voterId"
        );

      console.log(`✅ Approved VoterID: ${voterId}`);

      approvedVoters.push({
        voterId: voterId,
        walletAddress: voter.WalletAddress,
        citizenId: voter.CitizenID,
      });
    }

    if (approvedVoters.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Không có cử tri nào được duyệt (có thể đã duyệt hoặc không tồn tại)",
      });
    }

    res.json({
      success: true,
      message: `Đã duyệt ${approvedVoters.length} cử tri`,
      data: approvedVoters,
    });
  } catch (error) {
    console.error("❌ approveVoter error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi duyệt cử tri",
      error: error.message,
    });
  }
};

// Từ chối cử tri (reject) - Xóa khỏi danh sách
export const rejectVoter = async (req, res) => {
  const { voterIds } = req.body;

  if (!voterIds || (Array.isArray(voterIds) && voterIds.length === 0)) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin VoterID",
    });
  }

  const ids = Array.isArray(voterIds) ? voterIds : [voterIds];

  try {
    const pool = await poolPromise;
    const rejectedVoters = [];

    for (const voterId of ids) {
      const result = await pool
        .request()
        .input("voterId", sql.Int, voterId)
        .query(
          "DELETE FROM RegisteredVoters WHERE VoterID = @voterId AND IsApproved = 0"
        );

      if (result.rowsAffected[0] > 0) {
        rejectedVoters.push(voterId);
        console.log(`✅ Rejected VoterID: ${voterId}`);
      }
    }

    if (rejectedVoters.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Không có cử tri nào bị từ chối (có thể đã duyệt hoặc không tồn tại)",
      });
    }

    res.json({
      success: true,
      message: `Đã từ chối ${rejectedVoters.length} cử tri`,
      data: rejectedVoters,
    });
  } catch (error) {
    console.error("❌ rejectVoter error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối cử tri",
      error: error.message,
    });
  }
};

// Thống kê
export const getVoterStats = async (req, res) => {
  try {
    const pool = await poolPromise;

    const totalResult = await pool
      .request()
      .query("SELECT COUNT(*) as total FROM RegisteredVoters");

    const approvedResult = await pool
      .request()
      .query(
        "SELECT COUNT(*) as approved FROM RegisteredVoters WHERE IsApproved = 1"
      );

    const pendingResult = await pool
      .request()
      .query(
        "SELECT COUNT(*) as pending FROM RegisteredVoters WHERE IsApproved = 0"
      );

    res.json({
      success: true,
      data: {
        total: totalResult.recordset[0].total,
        approved: approvedResult.recordset[0].approved,
        pending: pendingResult.recordset[0].pending,
      },
    });
  } catch (error) {
    console.error("❌ getVoterStats error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê",
      error: error.message,
    });
  }
};
