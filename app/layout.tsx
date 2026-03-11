import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "ChainFund",
  description: "Decentralized lending platform on Polygon Amoy",
  icons: {
    icon: '/Zentra.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <CustomCursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
