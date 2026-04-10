'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/clients', label: '顧客' },
  { href: '/meals', label: '食事チェック' },
  { href: '/treatments', label: '施術記録' },
  { href: '/followups', label: 'フォロー' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-20 flex items-center px-6 border-b border-gray-200">
        <span className="text-3xl font-bold text-pg-green">Pg.</span>
        <span className="ml-2 text-sm text-gray-500">管理画面</span>
      </div>
      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-pg-green text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        Pg. Salon Admin
      </div>
    </aside>
  );
}
