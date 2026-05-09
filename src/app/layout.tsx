import type { Metadata } from "next";
import { Poppins, Outfit, Architects_Daughter, Raleway } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const architectsDaughter = Architects_Daughter({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-sketch",
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
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
    <html lang="pt-BR" className={`${poppins.variable} ${outfit.variable} ${architectsDaughter.variable} ${raleway.variable}`}>
      <body className="antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}


