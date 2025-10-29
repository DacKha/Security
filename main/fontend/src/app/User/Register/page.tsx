"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../Utils/contractConfig";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Register() {
  const [cccd, setCccd] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "otp" | "blockchain">("form");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Kết nối MetaMask
  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        alert("❌ Vui lòng cài đặt MetaMask!");
        return false;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      setCurrentAccount(accounts[0]);
      setIsConnected(true);
      setAddress(accounts[0]); // Tự động điền địa chỉ

      console.log("✅ Đã kết nối:", accounts[0]);
      return true;
    } catch (error) {
      console.error("❌ Lỗi kết nối:", error);
      alert("Không thể kết nối MetaMask!");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/check-cccd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cccd }),
      });

      const data = await res.json();
      console.log("✅ Kết quả check-cccd:", data);

      if (res.status === 403) {
        setMessage(data.message || "Bạn không phải là nhân viên công ty.");
        return;
      }

      if (data.exists) {
        setMessage("CCCD đã được đăng ký. Vui lòng kiểm tra lại.");
        return;
      }

      if (!data.email) {
        setMessage("Không tìm thấy email trong hệ thống Users.");
        return;
      }

      // ✅ Có email, lưu lại để xác thực OTP
      setEmail(data.email);

      // Gửi OTP
      const otpRes = await fetch("/api/users/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const otpData = await otpRes.json();
      console.log("✅ Phản hồi send-otp:", otpData);

      if (otpRes.ok) {
        setMessage("Đã gửi OTP xác thực đến email. Vui lòng nhập mã OTP.");
        setStep("otp");
      } else {
        setMessage(otpData.message || "Không gửi được OTP. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("❌ Lỗi khi gửi yêu cầu:", err);
      setMessage("Lỗi kết nối server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, cccd, address }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(
          "✅ Xác thực OTP thành công! Bây giờ đăng ký lên blockchain..."
        );

        // Chuyển sang bước đăng ký blockchain
        setStep("blockchain");

        // Tự động đăng ký lên blockchain
        await registerOnBlockchain();
      } else {
        setMessage(data.message || "OTP không đúng hoặc đã hết hạn.");
      }
    } catch (err) {
      setMessage("Lỗi kết nối server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký lên blockchain
  const registerOnBlockchain = async () => {
    try {
      setLoading(true);
      setMessage("⏳ Đang kết nối MetaMask...");

      if (typeof window === "undefined" || !window.ethereum) {
        alert("❌ Vui lòng cài đặt MetaMask!");
        return;
      }

      // Kết nối wallet nếu chưa
      if (!isConnected) {
        const connected = await connectWallet();
        if (!connected) {
          setMessage("❌ Không thể kết nối MetaMask. Vui lòng thử lại.");
          return;
        }
      }

      setMessage("📝 Đang gửi giao dịch đăng ký lên blockchain...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      console.log(
        "📡 Đang gọi registerVoter() với address:",
        currentAccount || address
      );

      const tx = await contract.registerVoter();
      console.log("📝 TX hash:", tx.hash);

      setMessage("⏳ Đang chờ xác nhận giao dịch...");

      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);

      setMessage("");
      alert(
        `🎉 Đăng ký thành công!\n\n` +
          `CCCD: ${cccd}\n` +
          `Địa chỉ ví: ${currentAccount || address}\n\n` +
          `TX Hash: ${tx.hash}\n\n` +
          `⏳ Vui lòng đợi Admin duyệt tài khoản của bạn để có thể bỏ phiếu.`
      );

      // Reset form
      setStep("form");
      setCccd("");
      setAddress("");
      setOtp("");
      setEmail("");
    } catch (err: any) {
      console.error("❌ Lỗi đăng ký blockchain:", err);

      let errorMessage = "Có lỗi xảy ra khi đăng ký lên blockchain!";

      if (err.code === "ACTION_REJECTED") {
        errorMessage = "❌ Bạn đã từ chối giao dịch!";
      } else if (err.reason) {
        errorMessage = `❌ ${err.reason}`;
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }

      setMessage(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 w-4/5">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white text-lg font-semibold py-3 px-5 shadow-md">
          ĐĂNG KÝ CỬ TRI
        </div>

        {step === "form" && (
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            {/* Wallet Connection */}
            {!isConnected ? (
              <div className="bg-yellow-50 border border-yellow-400 rounded-md p-4">
                <p className="text-sm text-yellow-700 mb-2">
                  ⚠️ Vui lòng kết nối MetaMask
                </p>
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-md transition"
                >
                  🦊 Kết nối MetaMask
                </button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-400 rounded-md p-3">
                <p className="text-xs text-green-700">
                  ✅ Đã kết nối:{" "}
                  <span className="font-mono text-xs break-all">
                    {currentAccount}
                  </span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-gray-700 mb-1">Số CCCD/CMND</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-700"
                placeholder="Nhập CCCD/CMND"
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">
                Địa Chỉ Ví (Ethereum Address)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-700 font-mono text-sm"
                placeholder="Tự động điền từ MetaMask"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                readOnly={isConnected}
                required
              />
              {isConnected && (
                <p className="text-xs text-gray-500 mt-1">
                  Địa chỉ được tự động lấy từ MetaMask
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-teal-500 text-white font-medium py-2 rounded-md transition duration-300"
              disabled={loading || !isConnected}
            >
              {loading ? "Đang kiểm tra..." : "Tiếp theo"}
            </button>
            {message && (
              <div className="mt-2 text-center text-sm text-red-600">
                {message}
              </div>
            )}
          </form>
        )}

        {step === "otp" && (
          <form className="p-6 space-y-4" onSubmit={handleVerifyOtp}>
            <div className="bg-blue-50 border border-blue-300 rounded-md p-3 mb-3">
              <p className="text-sm text-blue-700">
                📧 OTP đã được gửi đến email: <strong>{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-gray-700 mb-1">
                Nhập mã OTP (6 chữ số)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-700 text-center text-2xl tracking-widest"
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-teal-500 text-white font-medium py-2 rounded-md transition duration-300"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Đang xác thực..." : "Xác nhận OTP"}
            </button>
            {message && (
              <div className="mt-2 text-center text-sm text-red-600">
                {message}
              </div>
            )}
          </form>
        )}

        {step === "blockchain" && (
          <div className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium mb-2">
                Đang đăng ký lên blockchain...
              </p>
              <p className="text-sm text-gray-600">
                {message || "Vui lòng xác nhận giao dịch trong MetaMask"}
              </p>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-gray-50 p-4 border-t">
          <p className="text-xs text-gray-600 text-center">
            ℹ️ Sau khi đăng ký, vui lòng đợi Admin duyệt để có thể bỏ phiếu
          </p>
          <p className="text-xs text-gray-500 text-center mt-1 font-mono">
            Contract: {CONTRACT_ADDRESS.slice(0, 10)}...
          </p>
        </div>
      </div>
    </div>
  );
}
