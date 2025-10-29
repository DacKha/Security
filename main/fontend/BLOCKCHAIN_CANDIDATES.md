# 📋 Danh Sách Ứng Viên từ Blockchain

## ✅ Những gì đã thay đổi

### File: `src/app/Admin/page.tsx`

**Trước:** Lấy danh sách ứng viên từ Backend API (`http://localhost:5000/api/info_candidates`)

**Sau:** Lấy danh sách ứng viên trực tiếp từ Smart Contract thông qua `getAllCandidates()`

---

## 🔧 Tính năng mới

### 1. Kết nối trực tiếp với Blockchain

- Sử dụng `ethers.js` để kết nối với smart contract
- Không cần backend API để lấy danh sách ứng viên
- Dữ liệu luôn chính xác và đồng bộ với blockchain

### 2. Hiển thị thông tin từ Smart Contract

Mỗi ứng viên hiển thị:

- **ID**: Mã số ứng viên trên blockchain
- **Tên**: Tên ứng viên
- **Đảng/Nhóm**: Đảng hoặc nhóm ứng viên đại diện
- **Địa chỉ ví**: Ethereum wallet address của ứng viên
- **Số phiếu bầu**: Số phiếu hiện tại (realtime từ blockchain)

### 3. Nút tải lại

- Có thể tải lại danh sách bất cứ lúc nào
- Hiển thị trạng thái "Đang tải..."
- Hiển thị thông báo kết nối thành công

---

## 🎯 Cách sử dụng

### Yêu cầu:

1. ✅ Đã cài đặt MetaMask
2. ✅ MetaMask đã kết nối đúng mạng (network) với smart contract
3. ✅ Contract address đã được cấu hình trong `src/app/Utils/contractConfig.js`

### Truy cập:

1. Chạy frontend: `npm run dev`
2. Mở trình duyệt: `http://localhost:3000`
3. Vào trang **Admin** (trang chủ admin)
4. Danh sách ứng viên sẽ tự động load từ blockchain

---

## 📊 Dữ liệu hiển thị

```typescript
interface Candidate {
  id: bigint; // ID ứng viên trong smart contract
  name: string; // Tên ứng viên
  party: string; // Đảng/Nhóm
  candidateAddress: string; // Địa chỉ Ethereum wallet
  voteCount: bigint; // Số phiếu bầu hiện tại
}
```

---

## 🔍 Smart Contract Function

Trang này gọi function `getAllCandidates()` từ smart contract:

```solidity
function getAllCandidates()
    external
    view
    returns (Candidate[] memory)
```

Function này trả về array của tất cả ứng viên đã được thêm vào cuộc bầu cử.

---

## ⚠️ Lưu ý

1. **Không cần đăng nhập MetaMask** để xem danh sách (read-only)
2. **Dữ liệu luôn realtime** từ blockchain
3. **Không cache** - mỗi lần tải lại sẽ query blockchain mới
4. Nếu chưa có ứng viên nào, sẽ hiển thị thông báo "Chưa có ứng viên nào"

---

## 🆚 So sánh với cách cũ

| Tính năng         | Cách cũ (Backend API) | Cách mới (Blockchain) |
| ----------------- | --------------------- | --------------------- |
| Nguồn dữ liệu     | MySQL Database        | Smart Contract        |
| Độ chính xác      | Phụ thuộc đồng bộ     | 100% chính xác        |
| Số phiếu bầu      | Không có              | Có (realtime)         |
| Địa chỉ ví        | Không có              | Có                    |
| Phụ thuộc Backend | Có                    | Không                 |
| Tốc độ            | Nhanh                 | Phụ thuộc RPC         |

---

## 🔧 Troubleshooting

### Lỗi: "Vui lòng cài đặt MetaMask!"

**Giải pháp:** Cài đặt MetaMask extension trong trình duyệt

### Lỗi: "Chưa có ứng viên nào"

**Giải pháp:**

- Kiểm tra contract có ứng viên chưa bằng cách vào trang "Thêm ứng viên"
- Hoặc gọi `addCandidate()` từ smart contract

### Lỗi kết nối

**Giải pháp:**

- Kiểm tra MetaMask đã kết nối đúng network
- Kiểm tra contract address trong `contractConfig.js`
- Xem Console log trong DevTools để biết chi tiết lỗi

---

## 📝 Log trong Console

Khi load trang, console sẽ hiển thị:

```
📡 Đang lấy danh sách ứng viên từ blockchain...
✅ Nhận được: [Array of candidates]
```

Nếu có lỗi:

```
❌ Lỗi khi lấy danh sách ứng viên: [Error message]
```

---

## 🚀 Tính năng tương lai có thể thêm

- [ ] Filter/Search ứng viên
- [ ] Sort theo số phiếu
- [ ] Hiển thị % tỷ lệ phiếu bầu
- [ ] Export danh sách ra CSV
- [ ] Hiển thị lịch sử thay đổi số phiếu
- [ ] Real-time update khi có phiếu mới (WebSocket/Events)

---

**Ngày cập nhật:** 2025-10-17
