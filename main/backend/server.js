import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import electionRoutes from "./routes/election.js";
// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Port của frontend React
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
// Test route
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: err.message,
  });
});
// election routes
app.use("/api/election", electionRoutes);
// candidate routes
import candidateRoutes from "./routes/candidate_add.js";
app.use("/api/candidates", candidateRoutes);
// info candidate routes
import infoCandidateRoutes from "./routes/info_candidate.js";
app.use("/api/info_candidates", infoCandidateRoutes);
// info voter routes
import infoVoterRoutes from "./routes/voteRoutes.js";
app.use("/api/votes", infoVoterRoutes);
// phase routes
// Thêm vào server.js
import phaseRoutes from "./routes/phaseRoutes.js";
app.use("/api/phase", phaseRoutes);
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/users`);
});
