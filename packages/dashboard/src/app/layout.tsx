import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeContext Dashboard',
  description: 'AI-friendly codebase context viewer and analyzer',
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
