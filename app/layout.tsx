import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Timeline",
  description:
    "AI Timeline tracks conference deadlines, rebuttal windows, and decisions across major venues.",
  applicationName: "AI Timeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
