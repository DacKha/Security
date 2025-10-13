import express from "express";
import { getCandidates } from "../controllers/candidateController.js";
const router = express.Router();
// Lấy danh sách ứng viên
router.get("/", getCandidates);
export default router;
