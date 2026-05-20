import type { ReactNode } from "react";

import { DashboardNavbar } from "@/components/dashboard/navbar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <DashboardSidebar />

      <div className="flex min-h-screen flex-col md:pl-64">
        <DashboardNavbar />

        <main className="flex-1 bg-[#050505] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
