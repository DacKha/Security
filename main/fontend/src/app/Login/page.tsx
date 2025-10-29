"use client";
import { User, Shield } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const bg = ["/slide_bg/1.png", "/slide_bg/2.png", "/slide_bg/3.png"];

export default function LoginPage() {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cccd: "",
    password: "",
  });

  const [adminData, setAdminData] = useState({
    username: "",
    password: "",
  });

  // Tự động đổi ảnh nền
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % bg.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Xử lý nhập form user
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý nhập form admin
  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminData({ ...adminData, [e.target.name]: e.target.value });
  };

  // Submit form user
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isLogin
      ? "http://localhost:5000/api/users/login"
      : "http://localhost:5000/api/users/register";
    const body = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      alert(data.message);

      if (isLogin && res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/User");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi server");
    }
  };

  // Submit form admin
  const handleSubmitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminData),
      });
      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        localStorage.setItem("adminToken", data.token);
        router.push("/Admin");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi server");
    }
  };

  // Nếu chưa chọn form nào
  if (!showUserForm && !showAdminForm) {
    return (
      <div className="flex min-h-screen w-screen">
        <div className="w-3/5 h-screen">
          <img
            src={bg[currentImageIndex]}
            alt="background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-2/5 bg-white flex flex-col justify-center items-center p-10 max-h-screen shadow-2xl border">
          <div className="mb-10 flex col p-10 border border-black rounded-full shadow-2xl">
            <User className="text-black w-10 h-10" />
          </div>

          <div className="flex gap-6">
            <button
              onClick={() => setShowUserForm(true)}
              className="p-4 border border-blue-500 rounded-full bg-blue-400 text-white hover:bg-blue-600 hover:scale-105 transition-all duration-300"
            >
              User Login / Register
            </button>

            <button
              onClick={() => setShowAdminForm(true)}
              className="p-4 border border-yellow-500 rounded-full bg-yellow-400 text-white hover:bg-yellow-600 hover:scale-105 transition-all duration-300"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form người dùng
  if (showUserForm) {
    return (
      <div className="flex min-h-screen w-screen">
        <div className="w-3/5 h-screen">
          <img
            src={bg[currentImageIndex]}
            alt="background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-2/5 bg-white flex flex-col justify-center items-center p-10 max-h-screen shadow-2xl border">
          <h1 className="text-3xl font-bold mb-6 text-black">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </h1>

          <form
            className="w-full flex flex-col gap-4 text-gray-500 shadow-lg"
            onSubmit={handleSubmitUser}
          >
            {!isLogin && (
              <input
                type="text"
                name="name"
                placeholder="Họ và tên"
                value={formData.name}
                onChange={handleChange}
                className="p-3 border rounded"
                required
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="p-3 border rounded"
              required
            />
            {!isLogin && (
              <input
                type="text"
                name="cccd"
                placeholder="CCCD"
                value={formData.cccd}
                onChange={handleChange}
                className="p-3 border rounded"
                required
              />
            )}
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              className="p-3 border rounded"
              required
            />

            <button
              type="submit"
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <p className="mt-4 text-sm">
            {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </span>
          </p>

          <p
            className="mt-2 text-sm text-gray-500 cursor-pointer"
            onClick={() => setShowUserForm(false)}
          >
            ← Quay lại
          </p>
        </div>
      </div>
    );
  }

  // Form admin
  if (showAdminForm) {
    return (
      <div className="flex min-h-screen w-screen">
        <div className="w-3/5 h-screen">
          <img
            src={bg[currentImageIndex]}
            alt="background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-2/5 bg-white flex flex-col justify-center items-center p-10 max-h-screen shadow-2xl border">
          <h1 className="text-3xl font-bold mb-6 text-yellow-600 flex items-center gap-3">
            <Shield className="w-6 h-6" />
            Admin Login
          </h1>

          <form
            className="w-full flex flex-col gap-4 text-gray-500 shadow-lg"
            onSubmit={handleSubmitAdmin}
          >
            <input
              type="text"
              name="username"
              placeholder="Tên đăng nhập"
              value={adminData.username}
              onChange={handleAdminChange}
              className="p-3 border rounded"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={adminData.password}
              onChange={handleAdminChange}
              className="p-3 border rounded"
              required
            />

            <button
              type="submit"
              className="p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Đăng nhập
            </button>
          </form>

          <p
            className="mt-4 text-sm text-gray-500 cursor-pointer"
            onClick={() => setShowAdminForm(false)}
          >
            ← Quay lại
          </p>
        </div>
      </div>
    );
  }
}
