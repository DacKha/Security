import { redirect } from "next/navigation";

export default function HomePage() {
  // Khi truy cập "/", tự động chuyển đến /login
  redirect("/Login");
}
