import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'NDC Diagnostic Centre – Queue Management',
  description: 'Queue Management System for NDC Diagnostic Centre, Thane',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
