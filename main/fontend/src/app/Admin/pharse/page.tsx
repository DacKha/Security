"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI as ElectionABI,
} from "../../Utils/contractConfig";

export default function ChangePhasePage() {
  // ABI is imported from Utils/contractConfig (static)
  const ElectionABIState: any = ElectionABI || null;
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentPhase, setCurrentPhase] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // No remote ABI fetch - we use the ABI bundled in Utils/contractConfig

  // ==========================
  // 2️⃣ Kết nối MetaMask sau khi có ABI
  // ==========================
  useEffect(() => {
    if (!ElectionABIState || !mounted) return;
    connectWallet();
  }, [ElectionABIState, mounted]);

  async function connectWallet() {
    if (!window.ethereum) {
      setError("Vui lòng cài MetaMask!");
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setError(
        "Vui lòng cấu hình hợp lệ cho contract trong Utils/contractConfig.js"
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        ElectionABIState,
        signer
      );

      setContract(contractInstance);
      setCurrentAccount(accounts[0]);

      // Kiểm tra owner với error handling
      try {
        const owner = await contractInstance.owner();
        console.log("📌 Contract owner:", owner);
        console.log("👤 Current account:", accounts[0]);
        setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());
      } catch (ownerError: any) {
        console.warn("⚠️ Không thể kiểm tra owner:", ownerError);
        setIsOwner(false); // Assume not owner if check fails
        // Continue anyway
      }

      const phase = await contractInstance.currentPhase();
      setCurrentPhase(Number(phase));

      setLoading(false);
    } catch (error: any) {
      console.error("❌ Lỗi kết nối MetaMask:", error);
      setError(`Lỗi kết nối: ${error.message}`);
      setLoading(false);
    }
  }

  // ==========================
  // 3️⃣ Lắng nghe sự kiện MetaMask
  // ==========================
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        connectWallet();
      } else {
        setCurrentAccount("");
        setContract(null);
        setIsOwner(false);
        setCurrentPhase(null);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [ElectionABI]);

  // ==========================
  // 4️⃣ Chuyển Phase
  // ==========================
  async function changePhase(newPhase: number) {
    if (!contract) {
      setError("Contract chưa được khởi tạo");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const tx = await contract.setPhase(newPhase);
      await tx.wait();

      alert("✅ Đã chuyển giai đoạn thành công!");

      const updated = await contract.currentPhase();
      setCurrentPhase(Number(updated));

      setLoading(false);
    } catch (err: any) {
      console.error("❌ Lỗi chuyển phase:", err);
      const errorMsg = err.reason || err.message || "Lỗi không xác định";
      setError(`Lỗi khi chuyển phase: ${errorMsg}`);
      setLoading(false);
    }
  }

  // ==========================
  // 🔥 Reset toàn bộ cuộc bầu cử
  // ==========================
  async function handleEmergencyFullReset() {
    if (!contract) {
      setError("Contract chưa được khởi tạo");
      return;
    }

    const confirmMsg = `⚠️ CẢNH BÁO: Bạn chắc chắn muốn RESET TOÀN BỘ cuộc bầu cử?

Hành động này sẽ:
✖ Xóa tất cả ứng viên
✖ Xóa tất cả cử tri đã đăng ký
✖ Xóa tất cả phiếu bầu
✖ Đặt lại phase về Đăng ký (0)

KHÔNG THỂ HOÀN TÁC!`;

    if (!confirm(confirmMsg)) {
      return;
    }

    // Double confirmation
    if (
      !confirm(
        "⚠️ Xác nhận lần cuối: Bạn có CHẮC CHẮN muốn reset toàn bộ không?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("🔥 Đang gọi emergencyFullReset...");
      const tx = await contract.emergencyFullReset();

      console.log("📝 TX hash:", tx.hash);
      alert("⏳ Đang xử lý giao dịch... Vui lòng chờ confirmation.");

      await tx.wait();

      alert(
        "✅ Đã reset toàn bộ cuộc bầu cử thành công!\n\n🔄 Trang sẽ tự động tải lại..."
      );

      // Reload data
      const phase = await contract.currentPhase();
      setCurrentPhase(Number(phase));

      setLoading(false);

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("❌ Lỗi reset:", err);
      const errorMsg = err.reason || err.message || "Lỗi không xác định";
      setError(`Lỗi khi reset: ${errorMsg}`);
      setLoading(false);
    }
  }

  // ==========================
  // 5️⃣ UI hiển thị
  // ==========================
  const phaseNames = ["Đăng ký", "Bầu cử", "Kết thúc bầu cử"];
  const phaseColors = [
    "bg-blue-100 text-blue-800",
    "bg-yellow-100 text-yellow-800",
    "bg-green-100 text-green-800",
  ];

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 w-4/5">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">
          🕹️ Quản lý giai đoạn bầu cử
        </h1>

        {/* Loading ABI */}
        {!ElectionABI && !error && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Đang tải ABI từ backend...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-bold">⚠️ Lỗi</p>
            <p>{error}</p>
          </div>
        )}

        {/* Main Content */}
        {ElectionABI && !error && (
          <>
            {/* Thông tin tài khoản */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div>
                <span className="text-sm text-gray-600">
                  Tài khoản hiện tại:
                </span>
                <p className="font-mono text-sm break-all">
                  {currentAccount || "Chưa kết nối"}
                </p>
              </div>

              <div>
                <span className="text-sm text-gray-600">
                  Giai đoạn hiện tại:
                </span>
                {currentPhase !== null ? (
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ml-2 ${phaseColors[currentPhase]}`}
                  >
                    {phaseNames[currentPhase]}
                  </div>
                ) : (
                  <span className="ml-2 text-gray-500">Đang tải...</span>
                )}
              </div>

              <div>
                <span className="text-sm text-gray-600">Quyền Admin:</span>
                <span
                  className={`ml-2 font-semibold ${
                    isOwner ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isOwner ? "✓ Có quyền" : "✗ Không có quyền"}
                </span>
              </div>

              <div>
                <span className="text-sm text-gray-600">Contract:</span>
                <p className="font-mono text-xs break-all text-gray-500">
                  {CONTRACT_ADDRESS}
                </p>
              </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div className="text-center mb-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Đang xử lý giao dịch...</p>
              </div>
            )}

            {/* Nút kết nối nếu chưa connect */}
            {!currentAccount && (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kết nối MetaMask
              </button>
            )}

            {/* Thông báo không phải owner */}
            {currentAccount && !isOwner && (
              <div className="text-center">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ Chỉ chủ sở hữu (Admin) mới có quyền thay đổi giai đoạn!
                  </p>
                </div>
              </div>
            )}

            {/* Nút chuyển phase */}
            {currentAccount && isOwner && currentPhase !== null && (
              <div className="space-y-3">
                {currentPhase === 0 && (
                  <button
                    onClick={() => changePhase(1)}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    ▶️ Bắt đầu Bầu Cử
                  </button>
                )}

                {currentPhase === 1 && (
                  <button
                    onClick={() => changePhase(2)}
                    disabled={loading}
                    className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    ⏹️ Kết Thúc Bầu Cử
                  </button>
                )}

                {currentPhase === 2 && (
                  <button
                    onClick={() => changePhase(0)}
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    🔄 Reset về Giai Đoạn Đăng Ký
                  </button>
                )}

                {/* 🔥 Nút Emergency Reset - Danger Zone */}
                <div className="mt-6 pt-6 border-t-2 border-red-200">
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                      <span>⚠️</span> DANGER ZONE
                    </h3>
                    <p className="text-sm text-red-600 mb-3">
                      Reset toàn bộ cuộc bầu cử về trạng thái ban đầu. Xóa tất
                      cả ứng viên, cử tri và phiếu bầu.
                      <strong className="block mt-1">
                        KHÔNG THỂ HOÀN TÁC!
                      </strong>
                    </p>
                    <button
                      onClick={handleEmergencyFullReset}
                      disabled={loading}
                      className="w-full bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold border-2 border-red-900"
                    >
                      🔥 RESET TOÀN BỘ CUỘC BẦU CỬ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
