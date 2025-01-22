import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SideBar from "@/components/SideBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="w-screen h-screen">
      <div className="flex w-full h-full overflow-x-hidden">
        <div className="w-full flex justify-center">{children}</div>
      </div>
    </main>
  );
}
