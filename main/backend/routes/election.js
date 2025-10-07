import express from "express";
import electionContract from "../config/blockchain.js";

const router = express.Router();

// Lấy danh sách ứng cử viên
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await electionContract.getCandidates();
    res.json(candidates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Cannot fetch candidates" });
  }
});

// Bỏ phiếu
router.post("/vote", async (req, res) => {
  try {
    const { candidateId } = req.body;
    const tx = await electionContract.vote(candidateId);
    await tx.wait();
    res.json({ message: "Vote success", txHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Voting failed" });
  }
});

export default router;
