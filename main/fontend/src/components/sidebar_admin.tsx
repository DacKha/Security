import {
  CalendarDays,
  LogOut,
  ChartBar,
  Vote,
  ListTodo,
  Plus,
} from "lucide-react";
export default function AdminSideBar() {
  return (
    <div className="w-1/5 min-h-screen bg-white text-black border br-black">
      <div>
        <ul className="g-10 justify-center items-center p-5 mt-10">
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/Admin/" className="flex gap-3">
              <CalendarDays />
              Thông Tin Ứng Viên
            </a>
          </li>
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/Admin/add_candidate" className="flex gap-3">
              <Plus />
              Thêm Ứng Cử Viên
            </a>
          </li>
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/Admin/register" className="flex gap-3">
              <Vote />
              Dăng Kí Cử Tri
            </a>
          </li>
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/Admin/pharse" className="flex gap-3">
              <ChartBar />
              Thay Đổi Giai Đoạn
            </a>
          </li>
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white mt-30">
            <a href="/" className="flex gap-3">
              <LogOut />
              Đăng Xuất
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
