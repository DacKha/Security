"use client";
import React, { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../Utils/contractConfig";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function AddCandidatePage() {
  const [formData, setFormData] = useState({
    name: "",
    party: "",
    candidateAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    } catch (error) {
      console.error("❌ Lỗi kết nối:", error);
      alert("Không thể kết nối MetaMask!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.party || !formData.candidateAddress) {
      alert("⚠️ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // Validate Ethereum address
    if (!ethers.isAddress(formData.candidateAddress)) {
      alert("⚠️ Địa chỉ ví không hợp lệ! Vui lòng kiểm tra lại.");
      return;
    }

    setLoading(true);

    try {
      if (!window.ethereum) {
        alert("❌ Vui lòng cài MetaMask!");
        setLoading(false);
        return;
      }

      // Kết nối provider và signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      console.log("👤 Admin address:", accounts[0]);

      // Tạo contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Kiểm tra quyền owner (optional - contract sẽ revert nếu không phải owner)
      try {
        const owner = await contract.owner();
        console.log("📌 Contract owner:", owner);
        console.log("👤 Current account:", accounts[0]);

        if (owner.toLowerCase() !== accounts[0].toLowerCase()) {
          const confirmMsg =
            `⚠️ Cảnh báo: Bạn không phải Owner!\n\n` +
            `Owner: ${owner}\n` +
            `Bạn: ${accounts[0]}\n\n` +
            `Giao dịch có thể bị từ chối. Bạn có muốn tiếp tục?`;

          if (!confirm(confirmMsg)) {
            setLoading(false);
            return;
          }
        }
      } catch (ownerCheckError) {
        console.warn("⚠️ Không thể kiểm tra owner:", ownerCheckError);
        const confirmMsg =
          `⚠️ Không thể xác minh quyền Owner!\n\n` +
          `Lỗi: ${
            ownerCheckError instanceof Error
              ? ownerCheckError.message
              : "Unknown error"
          }\n\n` +
          `Có thể smart contract chưa được deploy đúng.\n` +
          `Bạn có muốn tiếp tục thử giao dịch?`;

        if (!confirm(confirmMsg)) {
          setLoading(false);
          return;
        }
      }

      console.log("📝 Đang thêm ứng viên vào blockchain...");
      console.log("- Tên:", formData.name);
      console.log("- Đảng:", formData.party);
      console.log("- Địa chỉ:", formData.candidateAddress);

      // Gọi function addCandidate từ smart contract
      const tx = await contract.addCandidate(
        formData.name,
        formData.party,
        formData.candidateAddress
      );

      console.log("⏳ TX hash:", tx.hash);
      alert("⏳ Đang xử lý giao dịch... Vui lòng chờ confirmation.");

      // Đợi transaction được confirm
      const receipt = await tx.wait();

      console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);

      alert(
        `✅ Thêm ứng viên thành công!\n\n` +
          `Tên: ${formData.name}\n` +
          `Đảng: ${formData.party}\n` +
          `Địa chỉ: ${formData.candidateAddress}\n\n` +
          `TX: ${tx.hash}`
      );

      // Reset form
      setFormData({ name: "", party: "", candidateAddress: "" });
    } catch (err: any) {
      console.error("❌ Lỗi:", err);

      let errorMessage = "Có lỗi xảy ra khi thêm ứng viên!";

      if (err.code === "ACTION_REJECTED") {
        errorMessage = "❌ Bạn đã từ chối giao dịch!";
      } else if (err.reason) {
        errorMessage = `❌ ${err.reason}`;
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 min-h-screen w-4/5">
      <div className="bg-white shadow-lg rounded-xl w-4/5 max-w-2xl">
        <div className="bg-green-500 text-white text-lg font-semibold rounded-t-xl px-6 py-3">
          🗳️ Thêm Ứng Viên vào Blockchain
        </div>

        {/* Thông tin kết nối */}
        <div className="px-6 pt-4">
          {!isConnected ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-800 font-semibold">
                    ⚠️ Chưa kết nối MetaMask
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Vui lòng kết nối ví để thêm ứng viên
                  </p>
                </div>
                <button
                  onClick={connectWallet}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Kết nối
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-sm text-green-800 font-semibold">
                ✅ Đã kết nối MetaMask
              </p>
              <p className="text-xs text-green-700 mt-1 font-mono">
                {currentAccount}
              </p>
            </div>
          )}

          {/* Contract info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Smart Contract:</span>
            </p>
            <p className="text-xs text-gray-800 font-mono break-all">
              {CONTRACT_ADDRESS}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-gray-700">
          {/* Tên ứng viên */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tên ứng viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          {/* Đảng/Nhóm */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Đảng / Nhóm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="party"
              placeholder="Ví dụ: Đảng A, Nhóm B, Độc lập"
              value={formData.party}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
            />
          </div>

          {/* Địa chỉ ví Ethereum */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Địa chỉ ví Ethereum <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="candidateAddress"
              placeholder="0x..."
              value={formData.candidateAddress}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Địa chỉ Ethereum wallet của ứng viên (bắt đầu bằng 0x...)
            </p>
          </div>

          {/* Hướng dẫn */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">
              📌 Lưu ý:
            </p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Chỉ Owner của smart contract mới có quyền thêm ứng viên</li>
              <li>Địa chỉ ví ứng viên phải là địa chỉ Ethereum hợp lệ</li>
              <li>Giao dịch sẽ cần gas fee và confirmation từ MetaMask</li>
              <li>
                Sau khi thêm thành công, ứng viên sẽ xuất hiện trong danh sách
              </li>
            </ul>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isConnected}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md shadow-md transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang xử lý trên Blockchain...
                </span>
              ) : !isConnected ? (
                "Vui lòng kết nối MetaMask"
              ) : (
                "✅ THÊM ỨNG VIÊN VÀO BLOCKCHAIN"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
