import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Suspense } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sobre Tudo - Caderno Digital de Estudos',
  description: 'Organize suas anotações de estudo por categorias com o caderno digital inteligente.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50 text-stone-900 flex flex-col min-h-screen`}
      >
        <Suspense fallback={<div className="h-16 bg-white border-b border-stone-200" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-center text-xs text-stone-600">
          <div className="max-w-7xl mx-auto px-4 font-mono">
            Sobre Tudo &copy; {new Date().getFullYear()} — Caderno Digital de Estudos
          </div>
        </footer>
      </body>
    </html>
  );
}
