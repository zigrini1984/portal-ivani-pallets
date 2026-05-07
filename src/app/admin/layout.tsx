import React from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F8EDD9] overflow-hidden text-[#133020]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}


