'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calculator, Database, Users, ShieldCheck, ClipboardList, LogOut, Clock, UserCheck } from 'lucide-react';

interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'operador';
}

interface BaseMetadata {
  filename: string;
  total_records: number;
  imported_at: string;
}

export default function Navbar({ initialUser }: { initialUser?: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [metadata, setMetadata] = useState<BaseMetadata | null>(null);
  const [user, setUser] = useState<SessionUser | null>(initialUser || null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Cargar metadatos de la base
    fetch('/api/metadata')
      .then((res) => res.json())
      .then((data) => {
        if (data.metadata) setMetadata(data.metadata);
      })
      .catch(() => {});

    // Siempre sincronizar sesión actualizada
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else if (!initialUser) {
          setUser(null);
        }
      })
      .catch(() => {});
  }, [pathname, initialUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const isLoginPage = pathname === '/login';

  // Formatear fecha legible
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' hs';
    } catch {
      return dateStr;
    }
  };

  // Enlaces de navegación
  const navLinks = [
    { href: '/', label: 'Simulador', icon: Calculator, roles: ['admin', 'operador'] },
    { href: '/admin/backlog', label: 'Backlog de Consultas', icon: ClipboardList, roles: ['admin'] },
    { href: '/admin/base', label: 'Base Diaria', icon: Database, roles: ['admin'] },
    { href: '/admin/users', label: 'Usuarios Habilitados', icon: Users, roles: ['admin'] },
  ];

  // Si aún no se sabe el rol o es admin, mostrar las opciones correspondientes
  const currentRole = user?.role || (initialUser?.role ?? 'admin');
  const visibleLinks = navLinks.filter((l) => l.roles.includes(currentRole));

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Lado Izquierdo: Logos Oficiales perfectamente enmarcados */}
          <div className="flex items-center space-x-5 shrink-0">
            <Link href="/" className="flex items-center group">
              <div className="flex items-center space-x-3 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 group-hover:shadow transition-all">
                <img
                  src="/logo-ppay.png"
                  alt="Personal Pay"
                  style={{ height: '22px', width: 'auto', maxHeight: '22px' }}
                  className="object-contain block"
                />
                <div className="h-4 w-px bg-slate-300" />
                <img
                  src="/logo-wecross.png"
                  alt="Wecross"
                  style={{ height: '18px', width: 'auto', maxHeight: '18px' }}
                  className="object-contain block"
                />
              </div>
            </Link>

            {/* Menú de Navegación según Rol (Visible en Desktop y Tablets) */}
            {!isLoginPage && (
              <nav className="flex items-center space-x-1 overflow-x-auto py-1">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
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
            )}
          </div>

          {/* Lado Derecho: Estado de Base y Usuario */}
          {!isLoginPage && (
            <div className="flex items-center space-x-3 shrink-0">
              {metadata && (
                <div className="hidden lg:flex flex-col items-end px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-300 font-medium">Base activa:</span>
                    <strong className="text-white font-mono">{metadata.total_records.toLocaleString('es-AR')}</strong>
                    <span className="text-slate-400">créditos</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Última act:</span>
                    <span className="text-cyan-300 font-medium">{formatDateTime(metadata.imported_at)}</span>
                  </div>
                </div>
              )}

              {/* Perfil del Usuario Activo */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                  {currentRole === 'admin' ? (
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-slate-200 font-semibold leading-tight text-xs">
                      {user?.name || user?.email || (currentRole === 'admin' ? 'Administrador Principal' : 'Operador')}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded w-fit mt-0.5 ${
                        currentRole === 'admin'
                          ? 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {currentRole === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 hover:border-rose-800/80 text-slate-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
