import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibeManager - AI-Powered SaaS Planning",
  description:
    "Plan full-stack SaaS applications, generate PRDs, and keep specs in sync with AI coding tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
