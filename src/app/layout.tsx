import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Portal Ivani | Logistics & Pallet Solutions",
  description: "Elite logistics management and sustainable pallet solutions for high-performance operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${geist.variable}`}>
      <body className="antialiased text-[#133020] bg-[#F8EDD9] min-h-screen">
        {children}
      </body>
    </html>
  );
}


