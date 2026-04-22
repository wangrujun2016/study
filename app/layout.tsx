import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '三面板拖拽布局',
  description: 'Next.js + Tailwind + DNDKit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
