import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Portal Ivani | Logística & Gestão de Ativos",
  description: "Gestão logística de alta performance e soluções sustentáveis para movimentação de cargas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${poppins.variable}`}>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}


