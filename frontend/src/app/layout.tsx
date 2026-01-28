import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BAG Burn - Burn NFTs for USDC",
  description: "Burn your BAG Cornucopias NFTs and receive USDC on Base",
  icons: {
    icon: "/BAG-MAIN.png",
    shortcut: "/BAG-MAIN.png",
    apple: "/BAG-MAIN.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
