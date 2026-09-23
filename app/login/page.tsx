'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail.trim()) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas.');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'operador') => {
    if (role === 'admin') {
      setEmail('admin@personalpay.com.ar');
      setPassword('admin123');
      handleSubmit(undefined, 'admin@personalpay.com.ar', 'admin123');
    } else {
      setEmail('operador@personalpay.com.ar');
      setPassword('operador123');
      handleSubmit(undefined, 'operador@personalpay.com.ar', 'operador123');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          <div className="bg-slate-900 text-white p-8 text-center border-b border-slate-800">
            <div className="flex items-center justify-center mb-5">
              <div className="flex items-center space-x-3.5 bg-white px-4 py-2 rounded-2xl shadow-md border border-slate-200">
                <img
                  src="/logo-ppay.png"
                  alt="Personal Pay"
                  style={{ height: '26px', width: 'auto', maxHeight: '26px' }}
                  className="object-contain block"
                />
                <div className="h-5 w-px bg-slate-300" />
                <img
                  src="/logo-wecross.png"
                  alt="Wecross"
                  style={{ height: '20px', width: 'auto', maxHeight: '20px' }}
                  className="object-contain block"
                />
              </div>
            </div>

            <h1 className="text-lg font-bold tracking-tight text-white">
              Calculador de Promesas & Deuda
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sistema de Liquidación y Auditoría de Créditos
            </p>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operador@personalpay.com.ar"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-2">
                Accesos Rápidos de Prueba
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-blue-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Administrador</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Control total: simulación, bases, backlog y usuarios.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operador')}
                disabled={loading}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-emerald-600">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Operador</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  Acceso exclusivo para simulación y cálculo de deuda.
                </p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Personal Pay &bull; Wecross &bull; Servidor centralizado seguro
        </p>
      </div>
    </div>
  );
}
