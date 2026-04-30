import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthSessionProvider } from '@/components/providers/session-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Warranty Audit AI',
  description: 'Auditoria preventiva de garantias para concessionárias',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
