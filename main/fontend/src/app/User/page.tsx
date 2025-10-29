export default function Home() {
  return (
    <div className="bg-white w-4/5 items-center">
      <div className="max-w-4xl mx-auto bg-white shadow-lg border border-gray-500 rounded-lg mt-10">
        {/* Header */}
        <div className="flex justify-center py-6">
          <div className="bg-cyan-500 text-white px-8 py-3 rounded-full">
            <h1 className="text-xl font-semibold">Hướng Dẫn Sử Dụng</h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Greeting */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-black">Chào mừng</h2>
            <p className="text-gray-700">
              Đây là một số hướng dẫn cho người dùng
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-6">
            <h3 className="text-base font-semibold mb-3 text-black">
              1. Đăng Ký Cư Trú
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex">
                <span className="mr-2">•</span>
                <span>
                  Để hỗ phiếu, người dùng cần đăng ký trước. Mẫu đăng ký có thể
                  sẽ được cung cấp trên trang web này
                </span>
              </li>
              <li className="flex">
                <span className="mr-2">•</span>
                <span>
                  Người dùng chỉ có thể đăng ký trong giai đoạn đăng ký. Khi
                  giai đoạn đăng ký kết thúc, người dùng sẽ không thể đăng ký và
                  do đó không thể bỏ phiếu
                </span>
              </li>
              <li className="flex">
                <span className="mr-2">•</span>
                <span>
                  Bất đăng ký, người dùng cần cung cấp số thẻ Aadhar và địa chỉ
                  tài khoản ma họ sẽ sử dụng để bỏ phiếu
                </span>
              </li>
              <li className="flex">
                <span className="mr-2">•</span>
                <span>
                  Ở giai đoạn đầu, tuổi của người dùng sẽ được kiểm tra. Chỉ
                  những người dùng từ 18 tuổi trở lên mới đủ điều kiện bỏ phiếu
                </span>
              </li>
              <li className="flex">
                <span className="mr-2">•</span>
                <span>
                  Giai đoạn thứ hai là xác thực OTP. Giai đoạn này yêu cầu người
                  dùng xác nhận bằng OTP sau khi nhập số Aadhar và kiểm tra tuổi
                  thành công
                </span>
              </li>
              <li className="flex">
                <span className="mr-2">•</span>
                <span>
                  Sau khi nhập đúng OTP, người dùng sẽ được đăng ký thành công
                </span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="mb-6">
            <h3 className="text-base font-semibold mb-3 text-black">
              2. Quy Trình Bỏ Phiếu
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex">
                <span className="mr-2">•</span>
                <span>
                  Quy trình bỏ phiếu được chia thành ba giai đoạn. Tất cả các
                  giai đoạn đều được quản lý bởi các khối thời gian dụ định.
                  Người dùng chỉ...
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
