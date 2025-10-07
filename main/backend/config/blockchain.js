import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Đọc ABI từ file build (hoặc copy trực tiếp)
const abi = JSON.parse(fs.readFileSync("./abi/Election.json", "utf8"));
const contractAddress = process.env.CONTRACT_ADDRESS;

const electionContract = new ethers.Contract(contractAddress, abi, wallet);

export default electionContract;
