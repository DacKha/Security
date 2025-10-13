import nodemailer from "nodemailer";
import electionContract from "../config/blockchain.js";
import { sql, poolPromise } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Lưu OTP tạm thời (bộ nhớ, production nên dùng DB/Redis)
const otpStore = {};

// Gửi OTP xác thực email khi đăng ký cử tri
export const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Thiếu email" });

  try {
    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP với thời gian hết hạn (5 phút)
    otpStore[email] = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 phút
    };

    console.log(`📧 OTP generated for ${email}: ${otp}`); // Debug

    // Cấu hình transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Gửi email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Mã OTP xác thực đăng ký cử tri",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0fdfa; border-radius: 8px;">
          <h2 style="color: #06b6d4;">🗳️ Xác thực đăng ký cử tri</h2>
          <p style="font-size: 16px;">Mã OTP của bạn là:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #0e7490; letter-spacing: 8px; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">⏱️ Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
        </div>
      `,
    });

    console.log(`✅ OTP sent successfully to ${email}`);
    res.json({ success: true, message: "Đã gửi OTP đến email" });
  } catch (error) {
    console.error("❌ sendOtp error:", error);
    res.status(500).json({ message: "Lỗi gửi OTP", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp, cccd, address } = req.body;

  if (!email || !otp || !cccd || !address) {
    return res.status(400).json({ message: "Thiếu thông tin xác thực" });
  }

  try {
    // Kiểm tra OTP có tồn tại và còn hạn không
    const otpData = otpStore[email];

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP không tồn tại hoặc đã hết hạn",
      });
    }

    if (Date.now() > otpData.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: "OTP đã hết hạn. Vui lòng yêu cầu mã mới",
      });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "OTP không đúng",
      });
    }

    // OTP hợp lệ - xóa khỏi store
    delete otpStore[email];
    console.log(`✅ OTP verified for ${email}`);

    const pool = await poolPromise;

    // Kiểm tra xem đã đăng ký trong RegisteredVoters chưa
    const existingVoter = await pool
      .request()
      .input("cccd", sql.VarChar, cccd)
      .query("SELECT * FROM RegisteredVoters WHERE CitizenID = @cccd");

    if (existingVoter.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "CCCD đã được đăng ký làm cử tri trước đó",
      });
    }

    const emp = await pool
      .request()
      .input("cccd", sql.VarChar, cccd)
      .query("SELECT EmployeeID FROM Employees WHERE CitizenID = @cccd");

    if (emp.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy EmployeeID cho CCCD này" });
    }

    const employeeid = emp.recordset[0].EmployeeID;

    // Lưu vào RegisteredVoters
    await pool
      .request()
      .input("employeeid", sql.Int, employeeid)
      .input("cccd", sql.VarChar, cccd)
      .input("address", sql.VarChar, address).query(`
    INSERT INTO RegisteredVoters (EmployeeID, CitizenID, WalletAddress, RegisteredAt, IsApproved)
    VALUES (@employeeid, @cccd, @address, GETDATE(), 0)
  `);

    console.log(`✅ Voter registered: CCCD=${cccd}, Email=${email}`);

    // Ghi nhận trên blockchain
    try {
      // ❌ Lưu ý: Cần wallet address thực từ MetaMask, không phải address từ form
      console.log("⚠️ Backend không thể gọi registerVoter() trực tiếp");
      console.log(
        "⚠️ User cần tự gọi registerVoter() từ frontend với MetaMask"
      );

      // TODO: Frontend cần tích hợp MetaMask và gọi contract.registerVoter()
      console.log(
        "✅ Database registration successful - blockchain pending user action"
      );
    } catch (bcErr) {
      console.error("⚠️ Blockchain error (non-critical):", bcErr);
    }

    return res.json({
      success: true,
      message: "Xác thực OTP thành công, đã đăng ký cử tri!",
    });
  } catch (error) {
    console.error("❌ verifyOtp error:", error);
    res.status(500).json({
      message: "Lỗi xác thực OTP",
      error: error.message,
    });
  }
};

// ✅ Kiểm tra CCCD và lấy email từ Users
export const checkCccd = async (req, res) => {
  const { cccd } = req.body;

  if (!cccd) {
    return res.status(400).json({ message: "Thiếu CCCD" });
  }

  try {
    const pool = await poolPromise;

    // BƯỚC 1: Kiểm tra CCCD có trong Employees không (xác nhận là nhân viên)
    const empResult = await pool
      .request()
      .input("cccd", sql.VarChar, cccd)
      .query("SELECT * FROM Employees WHERE CitizenID = @cccd");

    if (empResult.recordset.length === 0) {
      return res.status(403).json({
        message:
          "Bạn không phải là nhân viên trong công ty, không được tham gia bỏ phiếu.",
      });
    }

    console.log(`✅ Employee found: CCCD=${cccd}`);

    // BƯỚC 2: Kiểm tra CCCD có trong Users không (đã tạo tài khoản chưa)
    const userResult = await pool
      .request()
      .input("cccd", sql.VarChar, cccd)
      .query("SELECT * FROM Users WHERE CCCD = @cccd");

    if (userResult.recordset.length === 0) {
      return res.status(400).json({
        exists: false,
        message:
          "CCCD chưa được đăng ký tài khoản trong hệ thống Users. Vui lòng đăng ký tài khoản trước.",
      });
    }

    const user = userResult.recordset[0];
    console.log(`✅ User found: Email=${user.Email}`);

    // BƯỚC 3: Kiểm tra đã đăng ký cử tri (RegisteredVoters) chưa
    const voterResult = await pool
      .request()
      .input("cccd", sql.VarChar, cccd)
      .query("SELECT * FROM RegisteredVoters WHERE CitizenID  = @cccd");

    if (voterResult.recordset.length > 0) {
      return res.json({
        exists: true,
        message: "CCCD đã được đăng ký làm cử tri",
      });
    }

    // BƯỚC 4: Chưa đăng ký cử tri → Trả về email từ Users để gửi OTP
    return res.json({
      exists: false,
      email: user.Email, // ✅ Lấy email từ bảng Users
      message: "CCCD hợp lệ, sẵn sàng đăng ký cử tri",
    });
  } catch (error) {
    console.error("❌ checkCccd error:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, cccd, password } = req.body;

  try {
    const pool = await poolPromise;

    // Kiểm tra CCCD có phải nhân viên không
    const empCheck = await pool
      .request()
      .input("cccd", sql.VarChar, cccd)
      .query("SELECT * FROM Employees WHERE CitizenID = @cccd");

    if (empCheck.recordset.length === 0) {
      return res.status(403).json({
        message: "CCCD không thuộc nhân viên công ty",
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE Email = @email");

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ message: "Email đã được đăng ký" });
    }

    // Kiểm tra CCCD đã đăng ký chưa
    const existingCccd = await pool
      .request()
      .input("cccd", sql.VarChar, cccd)
      .query("SELECT * FROM Users WHERE CCCD = @cccd");

    if (existingCccd.recordset.length > 0) {
      return res.status(400).json({ message: "CCCD đã được đăng ký" });
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

    console.log(`✅ User registered: ${email}`);
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    console.error("❌ registerUser error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

export const loginUser = async (req, res) => {
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
      { id: user.ID, email: user.Email, cccd: user.CCCD },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`✅ User logged in: ${email}`);
    res.json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    console.error("❌ loginUser error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
