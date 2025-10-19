/**
 * @fileoverview Root layout component for PostCraft application
 *
 * Sets up the HTML document structure, fonts (Geist Sans and Mono), global styles,
 * and the Sonner toast notification system for the entire application.
 *
 * @module app/layout
 */

import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostCraft Studio",
  description: "Local email template studio for visual email design",
};

/**
 * Root layout component that wraps all pages
 *
 * Provides the HTML structure with configured fonts and global styles.
 * The Sonner Toaster is configured for top-right positioning of notifications.
 *
 * @param props - Layout props
 * @param props.children - Child pages/components to render
 * @returns {JSX.Element} The HTML document with all setup
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
