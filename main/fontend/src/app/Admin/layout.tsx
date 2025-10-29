import AdminSideBar from "@/components/sidebar_admin";

export default function Adminlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSideBar />
      {children}
    </div>
  );
}
