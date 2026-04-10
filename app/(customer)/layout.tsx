import React from "react";
import BottomNav from "@/components/customer/BottomNav";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FAFAF8] pb-[70px] text-[#2C2C2A]"
      style={{
        fontFamily:
          '-apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
      }}
    >
      {children}
      <BottomNav />
    </div>
  );
}
