"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../app/Utils/contractConfig";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ConnectWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("❌ Hãy cài đặt MetaMask trước!");
        return;
      }

      // Yêu cầu MetaMask mở ví
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const selectedAccount = accounts[0];
      setAccount(selectedAccount);

      // Kết nối provider + signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Kết nối contract
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
      setContract(contractInstance);

      alert("✅ Kết nối MetaMask thành công!");
    } catch (error) {
      console.error(error);
      alert("❌ Kết nối thất bại. Kiểm tra console log!");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {account ? (
        <p className="text-green-600 font-semibold">🟢 Đã kết nối: {account}</p>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white transition"
        >
          Kết nối MetaMask
        </button>
      )}
    </div>
  );
}
