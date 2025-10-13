// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { ethers } from "ethers";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Cổng frontend React
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== KẾT NỐI VỚI SMART CONTRACT ==================== //
let contract;
let contractStatus = {
  connected: false,
  message: "Chưa kết nối",
  address: null,
};

(async () => {
  try {
    // Kết nối RPC (Ganache / testnet)
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || "http://127.0.0.1:7545"
    );

    // Lấy địa chỉ Smart Contract
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Đọc file ABI
    const abiPath = path.join(process.cwd(), "abi", "Election.json");
    const abiData = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const abi = abiData.abi ? abiData.abi : abiData;

    // Khởi tạo instance contract
    contract = new ethers.Contract(contractAddress, abi, provider);

    // Kiểm tra contract có tồn tại không
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ Smart Contract chưa được deploy hoặc sai địa chỉ!");
      contractStatus = {
        connected: false,
        message: "Smart Contract chưa được deploy hoặc sai địa chỉ!",
        address: contractAddress,
      };
    } else {
      console.log("✅ Đã kết nối thành công với Smart Contract!");
      console.log(`📜 Contract Address: ${contractAddress}`);
      contractStatus = {
        connected: true,
        message: "Đã kết nối thành công với Smart Contract!",
        address: contractAddress,
      };
    }
  } catch (err) {
    console.error("🚨 Lỗi khi kết nối với Smart Contract:", err.message);
    contractStatus = {
      connected: false,
      message: `Lỗi kết nối: ${err.message}`,
      address: null,
    };
  }
})();

// ==================== ROUTES ==================== //
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import electionRoutes from "./routes/election.js";
import candidateRoutes from "./routes/candidate_add.js";
import infoCandidateRoutes from "./routes/info_candidate.js";
import infoVoterRoutes from "./routes/voteRoutes.js";
import phaseRoutes from "./routes/phaseRoutes.js";

// Routes chính
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/election", electionRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/info_candidates", infoCandidateRoutes);
app.use("/api/votes", infoVoterRoutes);
app.use("/api/phase", phaseRoutes);

// Route test API
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// API kiểm tra trạng thái kết nối Smart Contract
app.get("/api/connection-status", (req, res) => {
  res.json(contractStatus);
});

// API lấy ABI
app.get("/api/abi/:name", (req, res) => {
  const { name } = req.params;
  const filePath = path.join(process.cwd(), "abi", `${name}.json`);

  if (!fs.existsSync(filePath)) {
    return res
      .status(404)
      .json({ error: `❌ ABI file ${name}.json not found` });
  }

  try {
    const abiFile = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json(abiFile.abi ? abiFile.abi : abiFile);
  } catch (err) {
    console.error("Error reading ABI:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message,
  });
});

// ==================== KHỞI ĐỘNG SERVER ==================== //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/users`);
});
