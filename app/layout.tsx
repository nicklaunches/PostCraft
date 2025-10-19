import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostCraft Studio",
  description: "Local email template studio for visual email design",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
