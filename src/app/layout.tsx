import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import HeaderClient from '../components/HeaderClient';
import MigrationRunner from '../components/MigrationRunner';
import UserDataFixer from '../components/UserDataFixer';
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // We can't use hooks directly in a Server Component, so we'll handle this in HeaderClient
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <HeaderClient />
          <MigrationRunner />
          <UserDataFixer />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
