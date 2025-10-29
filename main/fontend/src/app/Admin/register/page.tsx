"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "../../Utils/contractConfig";

interface Voter {
  VoterID: number;
  EmployeeID: number;
  WalletAddress: string;
  CitizenID: string;
  RegisteredAt: string;
  IsApproved: number;
  EmployeeName?: string;
  EmployeeEmail?: string;
  EmployeePhone?: string;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
}

// ABI của Election contract (chỉ cần hàm verifyVoter và verifyVotersBatch)
const ELECTION_ABI = [
  "function verifyVoter(address _voter) external",
  "function verifyVotersBatch(address[] calldata _voters) external",
  "function owner() external view returns (address)",
];

export default function AdminApproveVotersPage() {
  const [pendingVoters, setPendingVoters] = useState<Voter[]>([]);
  const [approvedVoters, setApprovedVoters] = useState<Voter[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    approved: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"pending" | "approved">(
    "pending"
  );
  const [selectedVoters, setSelectedVoters] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);

  // MetaMask states
  const [account, setAccount] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState<number>(0);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  // use centralized contract address from Utils/contractConfig
  // const CONTRACT_ADDRESS imported above

  // Connect MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Vui lòng cài đặt MetaMask!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      console.log("✅ Connected to MetaMask:", accounts[0]);
    } catch (error: any) {
      console.error("MetaMask connection error:", error);
      alert("Lỗi kết nối MetaMask: " + error.message);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount("");
    setIsConnected(false);
    setChainId(0);
  };

  // Listen to account/chain changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) disconnectWallet();
        else setAccount(accounts[0]);
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/votes/pending`),
        axios.get(`${API_URL}/votes/approved`),
        axios.get(`${API_URL}/votes/stats`),
      ]);

      setPendingVoters(pendingRes.data.data || []);
      setApprovedVoters(approvedRes.data.data || []);
      setStats(statsRes.data.data || { total: 0, approved: 0, pending: 0 });
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle select voter
  const toggleSelectVoter = (voterId: number) => {
    setSelectedVoters((prev) =>
      prev.includes(voterId)
        ? prev.filter((id) => id !== voterId)
        : [...prev, voterId]
    );
  };

  // Select all
  const selectAll = () => {
    if (selectedVoters.length === pendingVoters.length) setSelectedVoters([]);
    else setSelectedVoters(pendingVoters.map((v) => v.VoterID));
  };

  // Verify voters on blockchain using MetaMask
  const verifyOnBlockchain = async (walletAddresses: string[]) => {
    if (!isConnected) throw new Error("Vui lòng kết nối MetaMask trước");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ELECTION_ABI,
        signer
      );

      console.log("🔗 Verifying on blockchain:", walletAddresses);

      if (walletAddresses.length > 1) {
        const tx = await contract.verifyVotersBatch(walletAddresses);
        console.log("📝 TX hash:", tx.hash);
        await tx.wait();
      } else {
        const tx = await contract.verifyVoter(walletAddresses[0]);
        console.log("📝 TX hash:", tx.hash);
        await tx.wait();
      }
      return true;
    } catch (error: any) {
      console.error("Blockchain verification error:", error);
      if (error.code === "ACTION_REJECTED")
        throw new Error("Bạn đã từ chối giao dịch");
      if (error.message.includes("Not owner"))
        throw new Error("Chỉ owner mới có thể verify voters");
      throw new Error("Lỗi blockchain: " + (error.reason || error.message));
    }
  };

  // Approve voters (MetaMask confirmation)
  const handleApprove = async (voterIds?: number[]) => {
    const ids = voterIds || selectedVoters;
    if (ids.length === 0)
      return alert("Vui lòng chọn ít nhất một cử tri để duyệt");

    if (!isConnected) {
      alert("Vui lòng kết nối MetaMask trước!");
      await connectWallet();
      return;
    }

    const votersToApprove = pendingVoters.filter((v) =>
      ids.includes(v.VoterID)
    );
    const walletAddresses = votersToApprove.map((v) => v.WalletAddress);

    if (
      !confirm(
        `Xác nhận duyệt ${ids.length} cử tri?\n\n⚠️ Bạn sẽ cần confirm transaction trên MetaMask`
      )
    )
      return;

    setProcessing(true);
    try {
      await verifyOnBlockchain(walletAddresses);
      const response = await axios.post(`${API_URL}/votes/approve`, {
        voterIds: ids,
      });
      alert(
        "✅ " + response.data.message + "\n\n🔗 Đã verify trên blockchain!"
      );
      setSelectedVoters([]);
      await fetchData();
    } catch (error: any) {
      alert("❌ " + (error.message || "Lỗi khi duyệt cử tri"));
    } finally {
      setProcessing(false);
    }
  };

  // Reject voters
  const handleReject = async (voterIds?: number[]) => {
    const ids = voterIds || selectedVoters;
    if (ids.length === 0)
      return alert("Vui lòng chọn ít nhất một cử tri để từ chối");
    if (
      !confirm(`Xác nhận từ chối ${ids.length} cử tri? (Sẽ xóa khỏi hệ thống)`)
    )
      return;

    setProcessing(true);
    try {
      const response = await axios.post(`${API_URL}/votes/reject`, {
        voterIds: ids,
      });
      alert(response.data.message);
      setSelectedVoters([]);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi từ chối cử tri");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString("vi-VN");
  const formatAddress = (addr: string) =>
    `${addr.substring(0, 6)}...${addr.substring(38)}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6 w-4/5">
      <div className="max-w-7xl mx-auto">
        {/* Header with MetaMask */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              🗳️ Quản lý Cử tri
            </h1>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 px-4 py-2 rounded-lg">
                    <p className="text-xs text-gray-600">Connected Account</p>
                    <p className="text-sm font-mono font-bold text-green-700">
                      {formatAddress(account)}
                    </p>
                    <p className="text-xs text-gray-500">Chain ID: {chainId}</p>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium flex items-center gap-2"
                >
                  <span>🦊</span> Connect MetaMask
                </button>
              )}
            </div>
          </div>

          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Bạn cần kết nối MetaMask để duyệt cử tri
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Tổng số cử tri</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setSelectedTab("pending")}
              className={`flex-1 px-6 py-3 font-medium transition ${
                selectedTab === "pending"
                  ? "bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ⏳ Chờ duyệt ({stats.pending})
            </button>
            <button
              onClick={() => setSelectedTab("approved")}
              className={`flex-1 px-6 py-3 font-medium transition ${
                selectedTab === "approved"
                  ? "bg-green-50 text-green-700 border-b-2 border-green-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ✅ Đã duyệt ({stats.approved})
            </button>
          </div>
        </div>

        {/* Pending Voters */}
        {selectedTab === "pending" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {pendingVoters.length > 0 && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {selectedVoters.length === pendingVoters.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
                {selectedVoters.length > 0 && (
                  <>
                    <button
                      onClick={() => handleApprove()}
                      disabled={processing || !isConnected}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing
                        ? "⏳ Đang xử lý..."
                        : `✅ Duyệt (${selectedVoters.length})`}
                    </button>
                    <button
                      onClick={() => handleReject()}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      ❌ Từ chối ({selectedVoters.length})
                    </button>
                  </>
                )}
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : pendingVoters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-xl">🎉 Không có cử tri chờ duyệt</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedVoters.length === pendingVoters.length
                          }
                          onChange={selectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        CCCD
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Họ tên
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        SĐT
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Wallet
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Ngày đăng ký
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingVoters.map((v) => (
                      <tr key={v.VoterID} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedVoters.includes(v.VoterID)}
                            onChange={() => toggleSelectVoter(v.VoterID)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">{v.VoterID}</td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {v.CitizenID}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {v.EmployeeName || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600">
                          {v.EmployeeEmail || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {v.EmployeePhone || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {formatAddress(v.WalletAddress)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDate(v.RegisteredAt)}
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-2">
                          <button
                            onClick={() => handleApprove([v.VoterID])}
                            disabled={processing || !isConnected}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs"
                          >
                            ✅ Duyệt
                          </button>
                          <button
                            onClick={() => handleReject([v.VoterID])}
                            disabled={processing}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                          >
                            ❌ Từ chối
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Approved Voters */}
        {selectedTab === "approved" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải...</p>
              </div>
            ) : approvedVoters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-xl">Chưa có cử tri nào được duyệt</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        CCCD
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Họ tên
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        SĐT
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Wallet
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Ngày đăng ký
                      </th>
                      <th className="px-4 py-3 text-left text-sm text-gray-600">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedVoters.map((voter) => (
                      <tr
                        key={voter.VoterID}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm">{voter.VoterID}</td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {voter.CitizenID}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {voter.EmployeeName || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600">
                          {voter.EmployeeEmail || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {voter.EmployeePhone || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {formatAddress(voter.WalletAddress)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDate(voter.RegisteredAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            Đã duyệt
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
