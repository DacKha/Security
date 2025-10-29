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

interface VoterInfo {
  isRegistered: boolean;
  isVerified: boolean;
  hasVoted: boolean;
  votedCandidateId: bigint;
}

export default function VotePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [currentPhase, setCurrentPhase] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kết nối MetaMask
  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        alert("❌ Vui lòng cài đặt MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      setCurrentAccount(accounts[0]);
      setIsConnected(true);

      console.log("✅ Đã kết nối:", accounts[0]);

      // Load dữ liệu sau khi kết nối
      await loadBlockchainData(accounts[0]);
    } catch (error) {
      console.error("❌ Lỗi kết nối:", error);
      alert("Không thể kết nối MetaMask!");
    }
  };

  // Load dữ liệu từ blockchain
  const loadBlockchainData = async (account?: string) => {
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

      console.log("📡 Đang lấy dữ liệu từ blockchain...");

      // Lấy phase hiện tại
      const phase = await contract.currentPhase();
      setCurrentPhase(Number(phase));
      console.log("Phase:", Number(phase));

      // Lấy danh sách ứng viên
      const candidatesData = await contract.getAllCandidates();
      const formattedCandidates: Candidate[] = candidatesData.map((c: any) => ({
        id: c.id,
        name: c.name,
        party: c.party,
        candidateAddress: c.candidateAddress,
        voteCount: c.voteCount,
      }));
      setCandidates(formattedCandidates);
      console.log("✅ Lấy được", formattedCandidates.length, "ứng viên");

      // Nếu đã kết nối, lấy thông tin voter
      if (account || currentAccount) {
        const voterAddress = account || currentAccount;
        const voter = await contract.getVoter(voterAddress);
        const voterData: VoterInfo = {
          isRegistered: voter.isRegistered,
          isVerified: voter.isVerified,
          hasVoted: voter.hasVoted,
          votedCandidateId: voter.votedCandidateId,
        };
        setVoterInfo(voterData);
        console.log("Voter info:", voterData);
      }

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
    loadBlockchainData();
  }, [mounted]);

  // Listen to MetaMask account changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        setIsConnected(true);
        loadBlockchainData(accounts[0]);
      } else {
        setCurrentAccount("");
        setIsConnected(false);
        setVoterInfo(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [mounted]);

  // Hàm bỏ phiếu
  const handleVote = async (candidateId: number) => {
    if (!isConnected) {
      alert("⚠️ Vui lòng kết nối MetaMask trước!");
      await connectWallet();
      return;
    }

    // Kiểm tra phase
    if (currentPhase !== 1) {
      alert(
        "⚠️ Chưa đến giai đoạn bỏ phiếu!\n\nGiai đoạn hiện tại: " +
          (currentPhase === 0
            ? "Đăng ký"
            : currentPhase === 2
            ? "Kết thúc"
            : "Không xác định")
      );
      return;
    }

    // Kiểm tra voter info
    if (!voterInfo) {
      alert("⚠️ Không thể kiểm tra trạng thái cử tri. Vui lòng thử lại!");
      return;
    }

    if (!voterInfo.isRegistered) {
      alert(
        "❌ Bạn chưa đăng ký làm cử tri!\n\nVui lòng đăng ký trước khi bỏ phiếu."
      );
      return;
    }

    if (!voterInfo.isVerified) {
      alert(
        "❌ Tài khoản của bạn chưa được Admin duyệt!\n\nVui lòng đợi Admin xác nhận."
      );
      return;
    }

    if (voterInfo.hasVoted) {
      const votedCandidate = candidates.find(
        (c) => Number(c.id) === Number(voterInfo.votedCandidateId)
      );
      alert(
        `⚠️ Bạn đã bỏ phiếu rồi!\n\nỨng viên đã chọn: ${
          votedCandidate?.name || "N/A"
        }`
      );
      return;
    }

    const candidate = candidates.find((c) => Number(c.id) === candidateId);
    if (!candidate) {
      alert("❌ Không tìm thấy ứng viên!");
      return;
    }

    const confirmMsg =
      `🗳️ Xác nhận bỏ phiếu cho:\n\n` +
      `Tên: ${candidate.name}\n` +
      `Đảng: ${candidate.party}\n\n` +
      `⚠️ Bạn chỉ được bỏ phiếu MỘT LẦN!\n` +
      `Không thể thay đổi sau khi xác nhận.\n\n` +
      `Bạn có chắc chắn?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    setVoting(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      console.log("🗳️ Đang bỏ phiếu cho ứng viên ID:", candidateId);

      const tx = await contract.vote(candidateId);
      console.log("📝 TX hash:", tx.hash);

      alert("⏳ Đang xử lý giao dịch...\n\nVui lòng đợi confirmation.");

      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);

      alert(
        `✅ Bỏ phiếu thành công!\n\n` +
          `Ứng viên: ${candidate.name}\n` +
          `Đảng: ${candidate.party}\n\n` +
          `TX: ${tx.hash}\n\n` +
          `🎉 Cảm ơn bạn đã tham gia bầu cử!`
      );

      // Reload data
      await loadBlockchainData(currentAccount);
    } catch (err: any) {
      console.error("❌ Lỗi bỏ phiếu:", err);

      let errorMessage = "Có lỗi xảy ra khi bỏ phiếu!";

      if (err.code === "ACTION_REJECTED") {
        errorMessage = "❌ Bạn đã từ chối giao dịch!";
      } else if (err.reason) {
        errorMessage = `❌ ${err.reason}`;
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }

      alert(errorMessage);
    } finally {
      setVoting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white w-4/5">
      <div className="p-6 max-w-6xl mx-auto bg-white">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          🗳️ Bỏ Phiếu Bầu Cử
        </h1>

        {/* Wallet Connection Status */}
        {!isConnected ? (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6 text-center">
            <p className="text-lg mb-4 text-gray-700">
              ⚠️ Vui lòng kết nối MetaMask để bỏ phiếu
            </p>
            <button
              onClick={connectWallet}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              🦊 Kết nối MetaMask
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700">
              ✅ Đã kết nối: <span className="font-mono">{currentAccount}</span>
            </p>
          </div>
        )}

        {/* Voter Status */}
        {isConnected && voterInfo && (
          <div
            className={`border-2 rounded-lg p-4 mb-6 ${
              voterInfo.isRegistered &&
              voterInfo.isVerified &&
              !voterInfo.hasVoted
                ? "bg-green-50 border-green-400"
                : voterInfo.hasVoted
                ? "bg-blue-50 border-blue-400"
                : "bg-red-50 border-red-400"
            }`}
          >
            <h2 className="font-bold mb-2">📋 Trạng thái cử tri:</h2>
            <div className="space-y-1 text-sm">
              <p>Đã đăng ký: {voterInfo.isRegistered ? "✅ Có" : "❌ Chưa"}</p>
              <p>Đã được duyệt: {voterInfo.isVerified ? "✅ Có" : "❌ Chưa"}</p>
              <p>Đã bỏ phiếu: {voterInfo.hasVoted ? "✅ Có" : "❌ Chưa"}</p>
              {voterInfo.hasVoted && (
                <p className="font-semibold text-blue-700">
                  Ứng viên đã chọn ID: {Number(voterInfo.votedCandidateId)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Phase Warning */}
        {currentPhase !== null && currentPhase !== 1 && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-semibold">
              ⚠️ Chưa đến giai đoạn bỏ phiếu!
            </p>
            <p className="text-sm text-red-600 mt-1">
              Giai đoạn hiện tại:{" "}
              {currentPhase === 0
                ? "Đăng ký cử tri"
                : currentPhase === 2
                ? "Kết thúc bầu cử"
                : `Phase ${currentPhase}`}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-lg">⏳ Đang tải dữ liệu từ blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-red-700">❌ Lỗi: {error}</p>
          </div>
        )}

        {/* Candidates List */}
        {!loading && candidates.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Chưa có ứng viên nào trong cuộc bầu cử
            </p>
          </div>
        )}

        {!loading && candidates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <div
                key={Number(candidate.id)}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {candidate.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-semibold">Đảng:</span>{" "}
                    {candidate.party}
                  </p>
                  <p className="text-sm text-gray-600 mb-1 break-all">
                    <span className="font-semibold">Địa chỉ:</span>
                    <br />
                    <span className="font-mono text-xs">
                      {candidate.candidateAddress}
                    </span>
                  </p>
                  <p className="text-lg font-bold text-blue-600 mt-3">
                    🗳️ Phiếu bầu: {Number(candidate.voteCount)}
                  </p>
                </div>

                <button
                  onClick={() => handleVote(Number(candidate.id))}
                  disabled={
                    voting ||
                    currentPhase !== 1 ||
                    !isConnected ||
                    !voterInfo?.isRegistered ||
                    !voterInfo?.isVerified ||
                    voterInfo?.hasVoted
                  }
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    voting ||
                    currentPhase !== 1 ||
                    !isConnected ||
                    !voterInfo?.isRegistered ||
                    !voterInfo?.isVerified ||
                    voterInfo?.hasVoted
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {voting
                    ? "⏳ Đang xử lý..."
                    : voterInfo?.hasVoted
                    ? "✅ Đã bỏ phiếu"
                    : currentPhase !== 1
                    ? "⚠️ Chưa đến giờ bỏ phiếu"
                    : !isConnected
                    ? "🦊 Vui lòng kết nối MetaMask"
                    : !voterInfo?.isRegistered
                    ? "❌ Chưa đăng ký"
                    : !voterInfo?.isVerified
                    ? "⏳ Chưa được duyệt"
                    : "🗳️ Bỏ phiếu"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-2">
            ℹ️ Hướng dẫn bỏ phiếu:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li>Kết nối MetaMask với tài khoản đã đăng ký</li>
            <li>Đợi Admin duyệt tài khoản (trạng thái "Đã được duyệt")</li>
            <li>Chọn ứng viên và nhấn "Bỏ phiếu"</li>
            <li>Xác nhận giao dịch trong MetaMask</li>
            <li>Chỉ được bỏ phiếu MỘT LẦN duy nhất!</li>
          </ol>
          <p className="text-xs text-blue-600 mt-3 font-mono">
            Smart Contract: {CONTRACT_ADDRESS}
          </p>
        </div>
      </div>
    </div>
  );
}
