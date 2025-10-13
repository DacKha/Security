// routes/phaseRoutes.js
import express from "express";
import electionContract from "../config/blockchain.js";
import { ethers } from "ethers";

const router = express.Router();

// Lấy phase hiện tại và thống kê
router.get("/current", async (req, res) => {
  try {
    const phase = await electionContract.currentPhase();
    const voterCount = await electionContract.voterCount();
    const candidateCount = await electionContract.candidateCount();
    const verifiedCount = await electionContract.getVerifiedVoterCount();
    const votedCount = await electionContract.getVotedCount();

    const phaseNames = ["Registration", "Voting", "Ended"];

    res.json({
      phase: Number(phase),
      phaseName: phaseNames[Number(phase)],
      statistics: {
        totalVoters: Number(voterCount),
        verifiedVoters: Number(verifiedCount),
        votedCount: Number(votedCount),
        candidateCount: Number(candidateCount),
      },
    });
  } catch (error) {
    console.error("Error getting phase:", error);
    res.status(500).json({ error: "Cannot get current phase" });
  }
});

// Chuyển sang giai đoạn tiếp theo
router.post("/transition", async (req, res) => {
  try {
    const { newPhase, adminAddress } = req.body;

    // Kiểm tra admin address
    const owner = await electionContract.owner();
    if (adminAddress.toLowerCase() !== owner.toLowerCase()) {
      return res.status(403).json({ error: "Only owner can change phase" });
    }

    // Lấy phase hiện tại
    const currentPhase = await electionContract.currentPhase();
    const current = Number(currentPhase);
    const target = Number(newPhase);

    // Validate transition
    const validTransitions = {
      0: [1], // Registration -> Voting
      1: [2], // Voting -> Ended
      2: [0], // Ended -> Registration (reset)
    };

    if (!validTransitions[current].includes(target)) {
      return res.status(400).json({
        error: `Invalid transition from phase ${current} to ${target}`,
      });
    }

    // Thực hiện chuyển phase
    const tx = await electionContract.setPhase(target);
    const receipt = await tx.wait();

    res.json({
      success: true,
      message: "Phase changed successfully",
      txHash: receipt.hash,
      newPhase: target,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    console.error("Error changing phase:", error);
    res.status(500).json({
      error: "Failed to change phase",
      details: error.message,
    });
  }
});

// Lấy thông tin chi tiết cho từng phase
router.get("/details/:phase", async (req, res) => {
  try {
    const { phase } = req.params;
    const phaseNum = parseInt(phase);

    if (phaseNum < 0 || phaseNum > 2) {
      return res.status(400).json({ error: "Invalid phase number" });
    }

    let details = {};

    if (phaseNum === 0) {
      // Registration Phase
      const voterCount = await electionContract.voterCount();
      const verifiedCount = await electionContract.getVerifiedVoterCount();
      const candidateCount = await electionContract.candidateCount();

      details = {
        phase: "Registration",
        totalRegistered: Number(voterCount),
        verified: Number(verifiedCount),
        pending: Number(voterCount) - Number(verifiedCount),
        candidatesAdded: Number(candidateCount),
      };
    } else if (phaseNum === 1) {
      // Voting Phase
      const voterCount = await electionContract.voterCount();
      const votedCount = await electionContract.getVotedCount();
      const turnout = await electionContract.getTurnoutPercentage();

      details = {
        phase: "Voting",
        eligibleVoters: Number(voterCount),
        voted: Number(votedCount),
        remaining: Number(voterCount) - Number(votedCount),
        turnoutPercentage: (Number(turnout) / 100).toFixed(2),
      };
    } else if (phaseNum === 2) {
      // End Phase
      const candidates = await electionContract.getAllCandidates();
      const hasTie = await electionContract.hasTie();
      const votedCount = await electionContract.getVotedCount();

      details = {
        phase: "Ended",
        totalVotes: Number(votedCount),
        hasTie: hasTie,
        results: candidates.map((c) => ({
          id: Number(c.id),
          name: c.name,
          party: c.party,
          voteCount: Number(c.voteCount),
        })),
      };
    }

    res.json(details);
  } catch (error) {
    console.error("Error getting phase details:", error);
    res.status(500).json({ error: "Cannot get phase details" });
  }
});

// Kiểm tra xem có thể chuyển phase không
router.get("/can-transition/:targetPhase", async (req, res) => {
  try {
    const { targetPhase } = req.params;
    const target = parseInt(targetPhase);

    const currentPhase = await electionContract.currentPhase();
    const current = Number(currentPhase);

    const validTransitions = {
      0: [1],
      1: [2],
      2: [0],
    };

    const canTransition = validTransitions[current]?.includes(target) || false;

    let warnings = [];

    if (canTransition && target === 1) {
      // Check if ready to start voting
      const candidateCount = await electionContract.candidateCount();
      const verifiedCount = await electionContract.getVerifiedVoterCount();

      if (Number(candidateCount) === 0) {
        warnings.push("No candidates added yet");
      }
      if (Number(verifiedCount) === 0) {
        warnings.push("No verified voters yet");
      }
    }

    res.json({
      canTransition,
      currentPhase: current,
      targetPhase: target,
      warnings,
    });
  } catch (error) {
    console.error("Error checking transition:", error);
    res.status(500).json({ error: "Cannot check transition" });
  }
});

export default router;
