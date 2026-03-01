"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IoHomeOutline,
  IoHome,
  IoListOutline,
  IoList,
  IoAddCircleOutline,
  IoAddCircle,
  IoBarChartOutline,
  IoBarChart,
  IoWalletOutline,
  IoWallet,
} from "react-icons/io5";

const navItems = [
  {
    href: "/",
    label: "ホーム",
    icon: IoHomeOutline,
    activeIcon: IoHome,
  },
  {
    href: "/expenses",
    label: "一覧",
    icon: IoListOutline,
    activeIcon: IoList,
  },
  {
    href: "/expenses/new",
    label: "追加",
    icon: IoAddCircleOutline,
    activeIcon: IoAddCircle,
  },
  {
    href: "/analytics",
    label: "分析",
    icon: IoBarChartOutline,
    activeIcon: IoBarChart,
  },
  {
    href: "/settlement",
    label: "精算",
    icon: IoWalletOutline,
    activeIcon: IoWallet,
  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = isActive ? item.activeIcon : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-primary-600" : "text-gray-400"
              }`}
            >
              <Icon className="text-2xl" />
              <span className="text-[10px] mt-0.5 font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
