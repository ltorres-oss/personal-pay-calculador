'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Database, Users, ShieldCheck, ClipboardList } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [metadata, setMetadata] = useState<{ filename: string; total_records: number; imported_at: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/metadata')
      .then((res) => res.json())
      .then((data) => {
        if (data.metadata) setMetadata(data.metadata);
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { href: '/', label: 'Simulador de Cuotas', icon: Calculator },
    { href: '/admin/backlog', label: 'Backlog de Consultas', icon: ClipboardList },
    { href: '/admin/base', label: 'Base Diaria', icon: Database },
    { href: '/admin/users', label: 'Usuarios Habilitados', icon: Users },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                  Personal <span className="text-cyan-400 font-extrabold">Pay</span>
                  <span className="text-[10px] bg-blue-500/20 text-cyan-300 font-medium px-2 py-0.5 rounded-full border border-blue-500/30">
                    PROMESAS
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">Calculador de Deuda & Punitorios</span>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {mounted && metadata && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Base activa:</span>
                <strong className="text-white font-mono">{metadata.total_records}</strong>
                <span className="text-slate-400">créditos</span>
              </div>
            )}

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col text-left">
                <span className="text-slate-200 font-semibold">admin@personalpay.com.ar</span>
                <span className="text-[10px] text-emerald-400 font-medium">Invitación Activa (Google)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
