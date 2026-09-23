'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SimulationResult } from '@/lib/types';
import ClientProfile from '@/components/ClientProfile';
import FinancialSummary from '@/components/FinancialSummary';
import PromiseSelector from '@/components/PromiseSelector';
import QuickOfferCopy from '@/components/QuickOfferCopy';
import InstallmentsTable from '@/components/InstallmentsTable';
import { Search, Loader2, AlertCircle, ArrowRight, Database, Clock, ShieldAlert } from 'lucide-react';

function SimulatorContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [searchInput, setSearchInput] = useState('27283089938');
  const [promiseDays, setPromiseDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [metadata, setMetadata] = useState<{ filename: string; total_records: number; imported_at: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  // Formatear fecha legible
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'No registrada';
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

  // Cargar metadatos y usuario actual
  useEffect(() => {
    setMounted(true);

    if (searchParams.get('error') === 'unauthorized_role') {
      setRoleNotice('Acceso Restringido: Tu cuenta tiene perfil de Operador (habilitado exclusivamente para simulación de cuotas). Los módulos de administración requieren rol Administrador.');
    }

    // Leer cookie de sesión inmediatamente para tener el rol instantáneamente
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/ppay_session=([^;]+)/);
      if (match && match[1]) {
        try {
          const [base64] = match[1].split('.');
          const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
          const parsed = JSON.parse(decoded);
          if (parsed && parsed.role) {
            setCurrentUser(parsed);
          }
        } catch {}
      }
    }

    const loadMeta = () => {
      fetch('/api/metadata?t=' + Date.now(), { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.metadata) setMetadata(data.metadata);
        })
        .catch(() => {});
    };

    loadMeta();
    window.addEventListener('base_updated', loadMeta);

    fetch('/api/auth/me?t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('base_updated', loadMeta);
    };

    handleSimulate('27283089938', 2);
  }, []);

  // Función principal de simulación
  const handleSimulate = async (cuilToQuery = searchInput, days = promiseDays) => {
    const cleanCuil = cuilToQuery.trim();
    if (!cleanCuil) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const operatorParam = currentUser?.email ? `&operator=${encodeURIComponent(currentUser.email)}` : '';
      const res = await fetch(`/api/simulate?cuil=${encodeURIComponent(cleanCuil)}&promise_days=${days}${operatorParam}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al consultar la base de datos.');
      }

      setSimulation(data);
      if (data.has_tna_zero) {
        setPromiseDays(0);
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado.');
      setSimulation(null);
    } finally {
      setLoading(false);
    }
  };

  // Buscar sugerencias mientras escribe
  useEffect(() => {
    if (searchInput.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetch('/api/search?q=' + encodeURIComponent(searchInput.trim()))
          .then((res) => res.json())
          .then((data) => {
            if (data.results) setSuggestions(data.results);
          })
          .catch(() => {});
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchInput]);

  const handlePromiseChange = (newDays: number) => {
    setPromiseDays(newDays);
    if (simulation) {
      handleSimulate(simulation.customer.cuil, newDays);
    }
  };

  if (!mounted) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Cargando Personal Pay...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aviso de Rol si intentó acceder a sección no autorizada */}
      {roleNotice && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Aviso de Permisos</strong>
            <span>{roleNotice}</span>
          </div>
          <button
            onClick={() => setRoleNotice(null)}
            className="text-amber-600 hover:text-amber-800 text-xs font-bold px-2 py-1"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Top Search & Actions Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Simulador de Promesas & Deuda Personal Pay</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Operativo
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Ingrese el CUIL o DNI del titular para liquidar cuotas vigentes y calcular intereses punitorios bonificados.
            </p>
          </div>

          {/* Badge Informativo de Base Activa y Última Actualización */}
          {metadata && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl self-start md:self-auto">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Database className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span>Base Activa:</span>
                  <span className="text-blue-600 font-mono">{metadata.total_records.toLocaleString('es-AR')}</span>
                  <span className="text-slate-400 font-normal">créditos</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                  <Clock className="w-3 h-3 text-cyan-600" />
                  <span>Fecha de última actualización:</span>
                  <strong className="text-slate-700 font-medium">{formatDateTime(metadata.imported_at)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Input Box */}
        <div className="mt-5 relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSimulate();
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ingrese CUIL (ej: 27283089938), DNI o Apellido..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-12 pr-4 py-3 text-sm font-medium rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-900 font-mono transition-all"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100">
                  {suggestions.map((item) => (
                    <button
                      key={item.cuil}
                      type="button"
                      onClick={() => {
                        setSearchInput(item.cuil);
                        handleSimulate(item.cuil, promiseDays);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {item.first_name} {item.last_name}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          CUIL: {item.cuil} {item.document_number ? '• DNI: ' + item.document_number : ''}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-blue-600 font-bold block">{item.total_cuotas} cuotas</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <span>Consultar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Results Workspace */}
      {simulation && (
        <div className="space-y-6">
          {/* Alerta Crítica en ROJO Fuerte si el cliente tiene productos con TNA 0% o Vacío */}
          {simulation.has_tna_zero && (
            <div className="bg-red-600 text-white rounded-2xl p-5 shadow-xl shadow-red-600/30 border-2 border-red-700 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-red-700/90 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                ⚠️
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-red-950/70 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-red-400/40">
                    RESTRICCIÓN CRÍTICA
                  </span>
                  <span className="text-xs font-bold text-red-100">
                    {simulation.tna_zero_count} cuota(s) con TNA 0% o sin tasa
                  </span>
                </div>
                <h3 className="text-base font-black tracking-tight text-white mt-1">
                  ¡ATENCIÓN OPERADOR! NO ES POSIBLE OTORGAR DÍAS DE PROMESA A ESTE CLIENTE
                </h3>
                <p className="text-xs text-red-100 mt-1 leading-relaxed">
                  Este titular registra productos o cuotas con <strong>TNA 0% o vacía</strong>. Por normativa de Personal Pay, <strong>NO es posible simular ni conceder días de promesa a futuro</strong>. Los valores exhibidos corresponden de forma estricta y única a la <strong>deuda al día de la fecha (pago en el día de hoy)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Top Row: Client Profile & Promise Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ClientProfile customer={simulation.customer} />
            </div>
            <div>
              <PromiseSelector
                promiseDays={promiseDays}
                onChange={handlePromiseChange}
                targetDateStr={simulation.fecha_vencimiento_promesa}
                hasTnaZero={simulation.has_tna_zero}
              />
            </div>
          </div>

          {/* Financial Summary (KPI Cards) */}
          <FinancialSummary simulation={simulation} />

          {/* Quick Offer Copy Box for WhatsApp & Call center - Solo visible para Administradores */}
          {currentUser?.role === 'admin' && (
            <QuickOfferCopy simulation={simulation} userRole={currentUser.role} />
          )}

          {/* Detailed Cuotas Table */}
          <InstallmentsTable cuotas={simulation.cuotas} />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Cargando Personal Pay...</span>
        </div>
      }
    >
      <SimulatorContent />
    </React.Suspense>
  );
}
