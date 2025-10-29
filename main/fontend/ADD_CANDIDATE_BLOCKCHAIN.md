# 🗳️ Thêm Ứng Viên vào Blockchain

## ✅ Những gì đã thay đổi

### File: `src/app/Admin/add_candidate/page.tsx`

**Trước:** Gửi dữ liệu ứng viên tới Backend API (`http://localhost:5000/api/candidates/add`)

**Sau:** Thêm ứng viên trực tiếp vào Smart Contract thông qua function `addCandidate()`

---

## 🔧 Tính năng mới

### 1. Kết nối MetaMask

- Nút "Kết nối" để kết nối ví MetaMask
- Hiển thị địa chỉ ví đã kết nối
- Kiểm tra quyền Owner trước khi thêm

### 2. Validation đầu vào

- ✅ Kiểm tra tất cả trường bắt buộc
- ✅ Validate địa chỉ Ethereum (phải hợp lệ)
- ✅ Chỉ Owner mới được phép thêm ứng viên

### 3. Thêm vào Blockchain

- Gọi function `addCandidate(name, party, candidateAddress)` từ smart contract
- Hiển thị TX hash và trạng thái xử lý
- Đợi transaction confirmation
- Thông báo kết quả chi tiết

### 4. UI/UX cải thiện

- Card thông tin kết nối MetaMask
- Hiển thị contract address
- Form fields rõ ràng với label
- Hướng dẫn sử dụng
- Loading animation khi xử lý
- Error handling chi tiết

---

## 📋 Form fields mới

### Trước (Backend):

```typescript
{
  name: string; // Tên ứng viên
  team: string; // Đội/Nhóm
  age: number; // Tuổi
  level: string; // Trình độ
}
```

### Sau (Blockchain):

```typescript
{
  name: string; // Tên ứng viên
  party: string; // Đảng/Nhóm
  candidateAddress: string; // Địa chỉ ví Ethereum
}
```

**Lưu ý:** Dữ liệu trên blockchain chỉ lưu thông tin cần thiết để tiết kiệm gas fee.

---

## 🎯 Cách sử dụng

### Bước 1: Kết nối MetaMask

1. Mở trang **Admin → Thêm ứng viên**
2. Nhấn nút **"Kết nối"** trong banner vàng
3. MetaMask sẽ popup → Chọn tài khoản Owner
4. Sau khi kết nối, banner chuyển sang màu xanh ✅

### Bước 2: Điền thông tin

- **Tên ứng viên**: Tên đầy đủ (VD: Nguyễn Văn A)
- **Đảng/Nhóm**: Tên đảng hoặc nhóm (VD: Đảng A, Nhóm B, Độc lập)
- **Địa chỉ ví**: Ethereum address của ứng viên (VD: 0x123...abc)

### Bước 3: Thêm vào Blockchain

1. Nhấn nút **"✅ THÊM ỨNG VIÊN VÀO BLOCKCHAIN"**
2. MetaMask popup → Xem lại thông tin giao dịch
3. Nhấn **"Xác nhận"** và trả gas fee
4. Đợi transaction được confirm (5-30 giây)
5. Thông báo thành công với TX hash

---

## 🔐 Quyền hạn

### Chỉ Owner có thể thêm ứng viên!

Code tự động kiểm tra:

```typescript
const owner = await contract.owner();
if (owner.toLowerCase() !== accounts[0].toLowerCase()) {
  alert("❌ Chỉ Owner mới có quyền thêm ứng viên!");
  return;
}
```

Nếu tài khoản đã kết nối **KHÔNG phải Owner**, sẽ có thông báo lỗi.

---

## 📊 Smart Contract Function

Trang này gọi function `addCandidate()`:

```solidity
function addCandidate(
    string memory _name,
    string memory _party,
    address _candidateAddress
) external onlyOwner
```

**Parameters:**

- `_name`: Tên ứng viên
- `_party`: Đảng/Nhóm ứng viên
- `_candidateAddress`: Địa chỉ Ethereum wallet của ứng viên

**Requirements:**

- ✅ Chỉ Owner có thể gọi (modifier `onlyOwner`)
- ✅ `_candidateAddress` phải là địa chỉ hợp lệ
- ✅ Cần gas fee để thực hiện transaction

**Events emitted:**

```solidity
event CandidateAdded(
    uint256 indexed candidateId,
    string name,
    string party,
    address candidateAddress
);
```

---

## ⚠️ Lưu ý quan trọng

### 1. Gas Fee

- Mỗi lần thêm ứng viên cần **GAS FEE**
- Phí phụ thuộc vào mạng (Mainnet, Testnet, Local)
- Ước tính: ~0.001 - 0.01 ETH (tùy mạng)

### 2. Địa chỉ ví ứng viên

- Phải là địa chỉ Ethereum hợp lệ (42 ký tự, bắt đầu bằng 0x)
- Có thể là địa chỉ của bất kỳ ai
- Địa chỉ này sẽ được lưu vĩnh viễn trên blockchain

### 3. Không thể xóa/sửa

- Sau khi thêm vào blockchain, **KHÔNG THỂ XÓA** ứng viên
- Muốn "xóa" thì chỉ có thể gọi `emergencyFullReset()`
- Hãy kiểm tra kỹ thông tin trước khi submit!

### 4. MetaMask network

- Phải kết nối đúng mạng nơi contract được deploy
- Nếu sai mạng → Transaction sẽ fail
- Kiểm tra network trong MetaMask trước khi thêm

---

## 🔍 Flow hoàn chỉnh

```
1. User mở trang Add Candidate
   ↓
2. Nhấn "Kết nối" → MetaMask popup
   ↓
3. Chọn account Owner → Kết nối thành công ✅
   ↓
4. Điền form (name, party, address)
   ↓
5. Nhấn "THÊM ỨNG VIÊN"
   ↓
6. Code validate input
   ↓
7. Code kiểm tra quyền Owner
   ↓
8. Gọi contract.addCandidate()
   ↓
9. MetaMask popup → Confirm transaction
   ↓
10. Đợi TX confirmation (5-30s)
    ↓
11. Thành công ✅ → Reset form
```

---

## 🆚 So sánh

| Tính năng     | Cách cũ (Backend)  | Cách mới (Blockchain) ✨      |
| ------------- | ------------------ | ----------------------------- |
| Lưu trữ       | MySQL Database     | **Smart Contract**            |
| Quyền thêm    | API authentication | **Owner only (on-chain)**     |
| Validation    | Backend            | **Frontend + Smart Contract** |
| Xác thực      | Sign message       | **Transaction signature**     |
| Gas fee       | ❌ Không           | ✅ **Có (cần ETH)**           |
| Không thể xóa | ❌                 | ✅ **Immutable**              |
| Địa chỉ ví    | ❌ Không lưu       | ✅ **Lưu on-chain**           |

---

## 🐛 Troubleshooting

### Lỗi: "Vui lòng cài đặt MetaMask!"

**Giải pháp:** Cài MetaMask extension

### Lỗi: "Chỉ Owner mới có quyền thêm ứng viên!"

**Giải pháp:**

- Kết nối lại với tài khoản Owner
- Kiểm tra địa chỉ Owner bằng cách gọi `contract.owner()`

### Lỗi: "Địa chỉ ví không hợp lệ!"

**Giải pháp:**

- Địa chỉ phải có 42 ký tự
- Bắt đầu bằng `0x`
- Ví dụ: `0x1234567890123456789012345678901234567890`

### Lỗi: "Insufficient funds"

**Giải pháp:**

- Tài khoản Owner không đủ ETH để trả gas fee
- Nạp thêm ETH vào ví

### Transaction bị "Pending" quá lâu

**Giải pháp:**

- Kiểm tra network congestion
- Có thể tăng gas price trong MetaMask
- Đợi hoặc cancel + retry

---

## 💡 Tips

1. **Test trên Testnet trước:**

   - Sepolia, Goerli, Mumbai
   - Free test ETH từ faucet
   - Không mất tiền thật

2. **Double-check địa chỉ ví:**

   - Copy-paste từ MetaMask
   - Kiểm tra kỹ trước khi submit
   - Không thể sửa sau khi thêm!

3. **Save TX hash:**

   - Copy TX hash sau khi thành công
   - Có thể xem trên Etherscan
   - Dùng để tracking on-chain

4. **Batch add (nếu nhiều ứng viên):**
   - Thêm từng người một
   - Đợi confirm trước khi thêm tiếp
   - Không spam transactions

---

## 📝 Example

### Input:

```
Tên ứng viên: Nguyễn Văn A
Đảng/Nhóm: Đảng Tiến Bộ
Địa chỉ ví: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
```

### Output (Success):

```
✅ Thêm ứng viên thành công!

Tên: Nguyễn Văn A
Đảng: Đảng Tiến Bộ
Địa chỉ: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1

TX: 0xabc123def456...
```

### On Blockchain:

```javascript
// Event emitted
CandidateAdded {
  candidateId: 1,
  name: "Nguyễn Văn A",
  party: "Đảng Tiến Bộ",
  candidateAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
}
```

---

## 🚀 Tính năng tương lai

- [ ] Upload ảnh ứng viên (IPFS)
- [ ] Thêm description/bio
- [ ] Batch add nhiều ứng viên cùng lúc
- [ ] Import từ CSV
- [ ] Preview trước khi submit
- [ ] Estimate gas fee trước

---

**Ngày cập nhật:** 2025-10-17
**Smart Contract:** `0xA799ea196A9445D8eddF3a61A05255DbbaD8a5B0`
