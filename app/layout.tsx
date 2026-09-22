import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Personal Pay - Calculador de Promesas y Punitorios',
  description: 'Sistema de cálculo de deudas actualizadas e intereses punitorios para créditos de Personal Pay',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          Personal Pay &copy; 2026 &bull; Calculador de Promesas de Pago &bull; Base centralizada en servidor
        </footer>
      </body>
    </html>
  );
}
