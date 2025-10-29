import {
  Home,
  User,
  Search,
  CalendarDays,
  LogOut,
  ChartBar,
  Vote,
  ListTodo,
} from "lucide-react";

export default function SideBar() {
  return (
    <div className="w-1/5 h-screen bg-white text-black border br-black shadow-2xl overflow-hidden">
      <div>
        <ul className="g-20 justify-center items-center p-5 mt-10">
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/User" className="flex gap-3">
              <CalendarDays />
              Thông Tin
            </a>
          </li>
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/User/Register" className="flex gap-3">
              <ListTodo />
              Đăng Kí Cử Tri
            </a>
          </li>
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/User/Vote" className="flex gap-3">
              <Vote />
              Khu Vực Bỏ Phiếu
            </a>
          </li>
          <li className="flex px-8 py-5 border border-black rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white">
            <a href="/User/Result" className="flex gap-3">
              <ChartBar />
              Kết Quả
            </a>
          </li>
          <li className="flex px-8 py-5 border border-blue-300 bg-blue-300 rounded-full mb-10 shadow-2xl gap-3 hover:bg-blue-700 hover:scale-105 duration-300 hover:text-white mt-40">
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
