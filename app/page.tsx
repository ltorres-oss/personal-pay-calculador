'use client';

import React, { useState, useEffect } from 'react';
import { SimulationResult } from '@/lib/types';
import ClientProfile from '@/components/ClientProfile';
import FinancialSummary from '@/components/FinancialSummary';
import PromiseSelector from '@/components/PromiseSelector';
import QuickOfferCopy from '@/components/QuickOfferCopy';
import InstallmentsTable from '@/components/InstallmentsTable';
import { Search, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [searchInput, setSearchInput] = useState('27283089938');
  const [promiseDays, setPromiseDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Función principal de simulación
  const handleSimulate = async (cuilToQuery = searchInput, days = promiseDays) => {
    const cleanCuil = cuilToQuery.trim();
    if (!cleanCuil) return;

    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const res = await fetch('/api/simulate?cuil=' + encodeURIComponent(cleanCuil) + '&promise_days=' + days);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al consultar la base de datos.');
      }

      setSimulation(data);
    } catch (err: any) {
      setError(err.message || 'Error inesperado.');
      setSimulation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    handleSimulate('27283089938', 2);
  }, []);

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
      {/* Top Search & Actions Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="max-w-3xl">
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

          {/* Quick test buttons */}
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <span>Ejemplos rápidos:</span>
            <button
              type="button"
              onClick={() => {
                setSearchInput('27283089938');
                handleSimulate('27283089938', 2);
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-semibold"
            >
              27283089938 (Caso Excel - 92 cuotas)
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">No se pudo realizar la simulación:</strong>
            <p className="mt-0.5 text-xs text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !simulation && (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Buscando créditos y evaluando fórmulas...</span>
        </div>
      )}

      {/* Simulation Results View */}
      {simulation && (
        <div className="space-y-6">
          <ClientProfile customer={simulation.customer} />

          <PromiseSelector
            promiseDays={promiseDays}
            onChange={handlePromiseChange}
            targetDateStr={simulation.fecha_vencimiento_promesa}
          />

          <FinancialSummary simulation={simulation} />

          <QuickOfferCopy simulation={simulation} />

          <InstallmentsTable cuotas={simulation.cuotas} />
        </div>
      )}
    </div>
  );
}
