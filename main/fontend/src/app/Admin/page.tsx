"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../Utils/contractConfig";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Candidate {
  id: bigint;
  name: string;
  party: string;
  candidateAddress: string;
  voteCount: bigint;
}

export default function InfoCandidatePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchCandidatesFromBlockchain();
  }, [mounted]);

  const fetchCandidatesFromBlockchain = async () => {
    try {
      setLoading(true);
      setError("");

      // Kiểm tra MetaMask
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("Vui lòng cài đặt MetaMask!");
      }

      // Kết nối provider (read-only, không cần signer)
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Tạo contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      console.log("📡 Đang lấy danh sách ứng viên từ blockchain...");

      // Gọi getAllCandidates từ smart contract
      const candidatesData = await contract.getAllCandidates();

      console.log("✅ Nhận được:", candidatesData);

      // Convert dữ liệu blockchain sang format hiển thị
      const formattedCandidates: Candidate[] = candidatesData.map((c: any) => ({
        id: c.id,
        name: c.name,
        party: c.party,
        candidateAddress: c.candidateAddress,
        voteCount: c.voteCount,
      }));

      setCandidates(formattedCandidates);
      setIsConnected(true);
    } catch (err) {
      console.error("❌ Lỗi khi lấy danh sách ứng viên:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi kết nối blockchain"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="bg-white w-4/5 p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Đang tải thông tin ứng viên...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white w-4/5 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Lỗi!</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white w-4/5 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          🗳️ Danh sách ứng viên (Blockchain)
        </h1>
        <button
          onClick={fetchCandidatesFromBlockchain}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          🔄 Tải lại
        </button>
      </div>

      {/* Thông tin contract */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Contract:</span>{" "}
          <span className="font-mono text-xs">{CONTRACT_ADDRESS}</span>
        </p>
        {isConnected && (
          <p className="text-sm text-green-600 mt-1">
            ✅ Đã kết nối blockchain
          </p>
        )}
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            📭 Chưa có ứng viên nào trong cuộc bầu cử
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Admin có thể thêm ứng viên trong phần "Thêm ứng viên"
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Tổng số:{" "}
            <span className="font-bold text-gray-800">{candidates.length}</span>{" "}
            ứng viên
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={Number(candidate.id)}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow bg-white"
              >
                {/* Header */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {candidate.name}
                    </h2>
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      ID: {Number(candidate.id)}
                    </span>
                  </div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {candidate.party}
                  </span>
                </div>

                {/* Thông tin */}
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">
                      Địa chỉ ví:
                    </span>
                    <p className="font-mono text-xs text-gray-800 break-all mt-1">
                      {candidate.candidateAddress}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="font-medium text-gray-600">
                      Số phiếu bầu:
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {Number(candidate.voteCount)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded transition-colors text-sm"
                      onClick={() =>
                        alert(
                          `Xem chi tiết ứng viên ${candidate.name}\n\nID: ${candidate.id}\nĐịa chỉ: ${candidate.candidateAddress}\nSố phiếu: ${candidate.voteCount}`
                        )
                      }
                    >
                      👁️ Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
