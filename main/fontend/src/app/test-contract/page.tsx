"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../Utils/contractConfig";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function TestContractPage() {
  const [status, setStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setStatus((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
    console.log(message);
  };

  const clearLogs = () => {
    setStatus([]);
  };

  const testConnection = async () => {
    clearLogs();
    setLoading(true);

    try {
      addLog("🔍 Kiểm tra MetaMask...");

      if (typeof window === "undefined" || !window.ethereum) {
        addLog("❌ MetaMask chưa được cài đặt!");
        setLoading(false);
        return;
      }
      addLog("✅ MetaMask đã cài đặt");

      addLog("🔗 Đang kết nối...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        addLog("❌ Không có tài khoản nào được kết nối");
        setLoading(false);
        return;
      }

      addLog(`✅ Đã kết nối: ${accounts[0]}`);

      // Kiểm tra network
      const network = await provider.getNetwork();
      addLog(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

      // Kiểm tra balance
      const balance = await provider.getBalance(accounts[0]);
      addLog(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

      // Kiểm tra contract address
      addLog(`📝 Contract Address: ${CONTRACT_ADDRESS}`);

      // Kiểm tra code tại địa chỉ contract
      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        addLog("❌ KHÔNG CÓ CODE TẠI ĐỊA CHỈ NÀY!");
        addLog("⚠️ Contract chưa được deploy hoặc địa chỉ sai!");
        addLog("💡 Hãy kiểm tra lại CONTRACT_ADDRESS trong contractConfig.js");
        setLoading(false);
        return;
      }

      addLog(`✅ Contract có code (${code.length} bytes)`);

      // Thử tạo contract instance
      addLog("🔧 Tạo contract instance...");
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      addLog("✅ Contract instance đã tạo");

      // Test các view functions
      addLog("📊 Đang test các view functions...");

      try {
        addLog("🔍 Gọi currentPhase()...");
        const phase = await contract.currentPhase();
        addLog(`✅ currentPhase: ${Number(phase)}`);
      } catch (err: any) {
        addLog(`❌ currentPhase() failed: ${err.message}`);
      }

      try {
        addLog("🔍 Gọi candidateCount()...");
        const count = await contract.candidateCount();
        addLog(`✅ candidateCount: ${Number(count)}`);
      } catch (err: any) {
        addLog(`❌ candidateCount() failed: ${err.message}`);
      }

      try {
        addLog("🔍 Gọi voterCount()...");
        const vCount = await contract.voterCount();
        addLog(`✅ voterCount: ${Number(vCount)}`);
      } catch (err: any) {
        addLog(`❌ voterCount() failed: ${err.message}`);
      }

      try {
        addLog("🔍 Gọi owner()...");
        const owner = await contract.owner();
        addLog(`✅ owner: ${owner}`);
        addLog(
          `🔑 Bạn ${
            owner.toLowerCase() === accounts[0].toLowerCase()
              ? "LÀ"
              : "KHÔNG PHẢI"
          } owner`
        );
      } catch (err: any) {
        addLog(`❌ owner() failed: ${err.message}`);
        addLog(`⚠️ Có thể contract không có hàm owner() hoặc địa chỉ sai`);
      }

      try {
        addLog("🔍 Gọi getAllCandidates()...");
        const candidates = await contract.getAllCandidates();
        addLog(`✅ getAllCandidates: ${candidates.length} ứng viên`);
        candidates.forEach((c: any, i: number) => {
          addLog(
            `   ${i + 1}. ${c.name} (${c.party}) - ${Number(c.voteCount)} votes`
          );
        });
      } catch (err: any) {
        addLog(`❌ getAllCandidates() failed: ${err.message}`);
      }

      try {
        addLog("🔍 Gọi getVoter() cho địa chỉ của bạn...");
        const voter = await contract.getVoter(accounts[0]);
        addLog(`✅ Voter status:`);
        addLog(`   - isRegistered: ${voter.isRegistered}`);
        addLog(`   - isVerified: ${voter.isVerified}`);
        addLog(`   - hasVoted: ${voter.hasVoted}`);
      } catch (err: any) {
        addLog(`❌ getVoter() failed: ${err.message}`);
      }

      addLog("✅ Test hoàn thành!");
    } catch (err: any) {
      addLog(`❌ Lỗi: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          🧪 Test Smart Contract Connection
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Contract Address:</span>{" "}
              <span className="font-mono text-xs break-all">
                {CONTRACT_ADDRESS}
              </span>
            </p>
            <p>
              <span className="font-semibold">ABI Functions:</span>{" "}
              {
                CONTRACT_ABI.filter((item: any) => item.type === "function")
                  .length
              }
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={testConnection}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "🔄 Đang test..." : "🚀 Bắt đầu Test"}
          </button>
        </div>

        <div
          className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm overflow-auto"
          style={{ maxHeight: "600px" }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-semibold">Console Log:</h2>
            <button
              onClick={clearLogs}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
            >
              Clear
            </button>
          </div>

          {status.length === 0 ? (
            <p className="text-gray-500">
              Nhấn "Bắt đầu Test" để kiểm tra contract...
            </p>
          ) : (
            <div className="space-y-1">
              {status.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap break-all">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">ℹ️ Hướng dẫn:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>Đảm bảo MetaMask đã được cài đặt và kết nối</li>
            <li>Kiểm tra bạn đang ở đúng network (Sepolia, Ganache, etc.)</li>
            <li>Xác nhận CONTRACT_ADDRESS trong contractConfig.js đúng</li>
            <li>
              Nếu thấy "KHÔNG CÓ CODE", contract chưa được deploy hoặc địa chỉ
              sai
            </li>
            <li>
              Nếu owner() failed, có thể contract không có hàm này hoặc địa chỉ
              sai
            </li>
          </ol>
        </div>

        <div className="mt-6 bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-2">🔧 Nếu có lỗi:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>
              <strong>No code at address:</strong> Contract chưa deploy hoặc địa
              chỉ sai
              <br />→ Deploy lại contract và update CONTRACT_ADDRESS
            </li>
            <li>
              <strong>could not decode result data:</strong> ABI không khớp hoặc
              contract sai
              <br />→ Kiểm tra ABI trong contractConfig.js có khớp với contract
              không
            </li>
            <li>
              <strong>Wrong network:</strong> MetaMask đang ở network khác
              <br />→ Switch sang network mà contract đã deploy (Sepolia,
              Ganache, etc.)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
