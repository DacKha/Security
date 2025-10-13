import express from "express";
import {
  getVotes,
  getPendingVoters,
  getApprovedVoters,
  approveVoter,
  rejectVoter,
  getVoterStats,
} from "../controllers/voteController.js";

const router = express.Router();

// Lấy tất cả voters
router.get("/", getVotes);

// Lấy danh sách chờ duyệt
router.get("/pending", getPendingVoters);

// Lấy danh sách đã duyệt
router.get("/approved", getApprovedVoters);

// Thống kê
router.get("/stats", getVoterStats);

// Duyệt cử tri (approve)
router.post("/approve", approveVoter);

// Từ chối cử tri (reject/delete)
router.post("/reject", rejectVoter);

export default router;
