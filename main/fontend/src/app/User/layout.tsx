import SideBar from "@/components/sidebar";
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SideBar />
      {children}
    </div>
  );
}
