import React from 'react';
import { SimulationResult } from '@/lib/types';
import { formatCurrency } from '@/lib/calculator';
import { DollarSign, ArrowUpRight, Gift, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface Props {
  simulation: SimulationResult;
}

export default function FinancialSummary({ simulation }: Props) {
  const { summary, dias_promesa, fecha_vencimiento_promesa } = simulation;

  return (
    <div className="space-y-4">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monto Total Base */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Monto Total Original</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight font-mono">
            {formatCurrency(summary.monto_total)}
          </div>
          <div className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1.5 border-t border-slate-100 pt-2">
            <span>Suma de {summary.total_cuotas} cuota(s) en base</span>
          </div>
        </div>

        {/* Card 2: Monto Actualizado c/Promesa */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-blue-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Deuda c/ Promesa</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight font-mono">
            {formatCurrency(summary.monto_actualizado)}
          </div>
          <div className="mt-2.5 text-[11px] text-blue-600 flex items-center justify-between border-t border-blue-100/60 pt-2 font-medium">
            <span>+{formatCurrency(summary.total_nuevos_punitorios)}</span>
            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
              +{dias_promesa}d punitorios
            </span>
          </div>
        </div>

        {/* Card 3: Reintegro Bonificado */}
        <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-purple-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Cálculo Reintegro</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Gift className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight font-mono">
            -{formatCurrency(summary.reintegro)}
          </div>
          <div className="mt-2.5 text-[11px] text-purple-600 flex items-center justify-between border-t border-purple-100/60 pt-2 font-medium">
            <span>Bonificación 100% punitorios</span>
            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
              Descuento
            </span>
          </div>
        </div>

        {/* Card 4: Monto Final Pago Deuda (Hero) */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 shadow-lg shadow-emerald-600/20 text-white relative overflow-hidden group hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Monto Final Pago Deuda</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/30 text-white">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-white tracking-tight font-mono">
            {formatCurrency(summary.monto_final)}
          </div>
          <div className="mt-2 text-xs text-emerald-100 flex items-center justify-between border-t border-emerald-500/40 pt-2 font-medium">
            <span>Total neto a cancelar</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded font-bold text-[10px]">
              Vto: {fecha_vencimiento_promesa}
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-200/60 rounded-xl p-3.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <div>
          <strong>Lógica de Liquidación:</strong> Al cliente se le informa la deuda actualizada con promesa ({formatCurrency(summary.monto_actualizado)}), y se le aplica el reintegro total de punitorios acumulados y devengados ({formatCurrency(summary.reintegro)}), resultando en el <strong>Monto Final a pagar de {formatCurrency(summary.monto_final)}</strong>.
        </div>
      </div>
    </div>
  );
}
