"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../Utils/contractConfig";

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

export default function Result() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [winner, setWinner] = useState<Candidate | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load kết quả từ blockchain
  const loadResults = async () => {
    try {
      setLoading(true);
      setError("");

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("Vui lòng cài đặt MetaMask!");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      console.log("📊 Đang lấy kết quả từ blockchain...");

      // Lấy phase hiện tại
      const phase = await contract.currentPhase();
      setCurrentPhase(Number(phase));

      // Lấy tất cả ứng viên
      const candidatesData = await contract.getAllCandidates();
      const formattedCandidates: Candidate[] = candidatesData.map((c: any) => ({
        id: c.id,
        name: c.name,
        party: c.party,
        candidateAddress: c.candidateAddress,
        voteCount: c.voteCount,
      }));

      // Sắp xếp theo số phiếu giảm dần
      formattedCandidates.sort(
        (a, b) => Number(b.voteCount) - Number(a.voteCount)
      );

      setCandidates(formattedCandidates);

      // Tính tổng số phiếu
      const total = formattedCandidates.reduce(
        (sum, c) => sum + Number(c.voteCount),
        0
      );
      setTotalVotes(total);

      // Tìm người thắng cuộc
      if (
        formattedCandidates.length > 0 &&
        Number(formattedCandidates[0].voteCount) > 0
      ) {
        setWinner(formattedCandidates[0]);
      }

      console.log("✅ Lấy được", formattedCandidates.length, "ứng viên");

      setLoading(false);
    } catch (err) {
      console.error("❌ Lỗi:", err);
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu"
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    loadResults();

    // Refresh mỗi 10 giây
    const interval = setInterval(loadResults, 10000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Tính phần trăm phiếu
  const getPercentage = (voteCount: bigint) => {
    if (totalVotes === 0) return 0;
    return ((Number(voteCount) / totalVotes) * 100).toFixed(2);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 w-4/5">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
          🏆 KẾT QUẢ BẦU CỬ
        </h1>

        {/* Phase Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <p className="text-center text-lg">
            <span className="font-semibold">Giai đoạn hiện tại:</span>{" "}
            <span
              className={`font-bold ${
                currentPhase === 0
                  ? "text-yellow-600"
                  : currentPhase === 1
                  ? "text-green-600"
                  : "text-blue-600"
              }`}
            >
              {currentPhase === 0
                ? "📝 Đăng ký cử tri"
                : currentPhase === 1
                ? "🗳️ Bỏ phiếu"
                : currentPhase === 2
                ? "✅ Kết thúc"
                : "Không xác định"}
            </span>
          </p>
          <p className="text-center text-sm text-gray-600 mt-2">
            Tổng số phiếu:{" "}
            <span className="font-bold text-blue-600">{totalVotes}</span>
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">⏳ Đang tải kết quả từ blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-red-700">❌ Lỗi: {error}</p>
            <button
              onClick={loadResults}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              🔄 Thử lại
            </button>
          </div>
        )}

        {/* Winner Card */}
        {!loading && winner && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-2xl p-8 mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              👑 NGƯỜI THẮNG CUỘC
            </h2>
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-4xl font-bold text-gray-800 mb-2">
                {winner.name}
              </h3>
              <p className="text-xl text-gray-600 mb-4">
                Đảng: <span className="font-semibold">{winner.party}</span>
              </p>
              <p className="text-3xl font-bold text-blue-600">
                🗳️ {Number(winner.voteCount)} phiếu (
                {getPercentage(winner.voteCount)}%)
              </p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && candidates.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg">
            <p className="text-gray-600">Chưa có kết quả bầu cử</p>
          </div>
        )}

        {/* Results Table */}
        {!loading && candidates.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="py-4 px-4 text-left">Thứ hạng</th>
                  <th className="py-4 px-4 text-left">Ứng viên</th>
                  <th className="py-4 px-4 text-left">Đảng</th>
                  <th className="py-4 px-4 text-center">Số phiếu</th>
                  <th className="py-4 px-4 text-center">Tỷ lệ</th>
                  <th className="py-4 px-4 text-center">Biểu đồ</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr
                    key={Number(candidate.id)}
                    className={`border-b hover:bg-gray-50 ${
                      index === 0 ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && (
                          <span className="text-gray-600">#{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-800">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono break-all">
                        {candidate.candidateAddress.slice(0, 10)}...
                        {candidate.candidateAddress.slice(-8)}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {candidate.party}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xl font-bold text-blue-600">
                        {Number(candidate.voteCount)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-lg font-semibold text-purple-600">
                        {getPercentage(candidate.voteCount)}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${
                            index === 0
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                              : index === 1
                              ? "bg-gradient-to-r from-gray-300 to-gray-400"
                              : index === 2
                              ? "bg-gradient-to-r from-orange-400 to-orange-600"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${getPercentage(candidate.voteCount)}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Statistics */}
        {!loading && candidates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-gray-600 mb-2">Tổng số ứng viên</h3>
              <p className="text-4xl font-bold text-blue-600">
                {candidates.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-gray-600 mb-2">Tổng số phiếu</h3>
              <p className="text-4xl font-bold text-green-600">{totalVotes}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-gray-600 mb-2">Phiếu cao nhất</h3>
              <p className="text-4xl font-bold text-purple-600">
                {candidates.length > 0 ? Number(candidates[0].voteCount) : 0}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-4">
          <p className="text-center text-sm text-gray-600">
            ℹ️ Kết quả được cập nhật tự động mỗi 10 giây
          </p>
          <p className="text-center text-xs text-gray-500 mt-2 font-mono">
            Smart Contract: {CONTRACT_ADDRESS}
          </p>
        </div>
      </div>
    </div>
  );
}
