"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home", label: "ホーム", icon: "◉" },
  { href: "/meal", label: "食事", icon: "◎" },
  { href: "/weight", label: "体重", icon: "△" },
  { href: "/graph", label: "グラフ", icon: "▽" },
];

export default function BottomNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-[#E8E6DF] bg-white">
      <ul className="flex">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center py-2 text-[10px] ${
                  active ? "text-pg-green" : "text-[#888]"
                }`}
              >
                <span className="mb-0.5 text-xl leading-none">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
