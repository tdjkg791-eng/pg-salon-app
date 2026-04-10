import type { Metadata } from 'next';
import Sidebar from '@/components/admin/Sidebar';

export const metadata: Metadata = {
  title: 'Pg. 管理画面',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 min-w-[1024px]">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
