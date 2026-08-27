import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Architecture Studio",
  description: "Build and play your system designs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
