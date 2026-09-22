'use client';

import React, { useState } from 'react';
import { InstallmentCalculation } from '@/lib/types';
import { formatCurrency } from '@/lib/calculator';
import { ChevronDown, ChevronUp, Search, Calendar, AlertCircle } from 'lucide-react';

interface Props {
  cuotas: InstallmentCalculation[];
}

export default function InstallmentsTable({ cuotas }: Props) {
  const [filter, setFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const filtered = cuotas.filter((c) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (
      String(c.nro_credito || '').toLowerCase().includes(term) ||
      String(c.nro_cuota).includes(term) ||
      String(c.articulo || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Detalle de Cuotas & Créditos ({cuotas.length})
          </h3>
          <p className="text-xs text-slate-500">
            Desglose de cada obligación, mora, tasa TNA y punitorios recalculados
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por crédito o artículo..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th className="py-3 px-4">Crédito / Cuota</th>
              <th className="py-3 px-3">Vencimiento</th>
              <th className="py-3 px-3 text-right">Cuota Actualizada</th>
              <th className="py-3 px-2 text-center">TNA</th>
              <th className="py-3 px-2 text-center">Mora Base</th>
              <th className="py-3 px-2 text-center">Mora+Prom.</th>
              <th className="py-3 px-3 text-right">Nuevos Punitorios</th>
              <th className="py-3 px-4 text-right font-bold text-blue-900">Deuda c/Promesa</th>
              <th className="py-3 px-2 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map((row) => {
              const isExpanded = expandedRow === row.id;
              return (
                <React.Fragment key={row.id}>
                  <tr
                    className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      row.dias_de_mora > 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                  >
                    {/* Crédito / Cuota */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{row.nro_credito}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {row.nro_cuota}/{row.total_cuotas}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[180px]">
                        {row.articulo || 'Sin descripción'}
                      </span>
                    </td>

                    {/* Vencimiento */}
                    <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {row.proximo_vto || '-'}
                    </td>

                    {/* Cuota Actualizada (B) */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(row.importe_total)}
                    </td>

                    {/* TNA (C) */}
                    <td className="py-3 px-2 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {row.tna_credito}%
                      </span>
                    </td>

                    {/* Dias mora (D) */}
                    <td className="py-3 px-2 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.dias_de_mora > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.dias_de_mora}d
                      </span>
                    </td>

                    {/* Mora + Promesa (H) */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-blue-700">
                      {row.mora_mas_promesa}d
                    </td>

                    {/* Nuevos Punitorios (I) */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-purple-700">
                      +{formatCurrency(row.punitorios_promesa)}
                    </td>

                    {/* Deuda Actualizada c/Promesa (J) */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-900 text-sm">
                      {formatCurrency(row.deuda_actualizada_promesa)}
                    </td>

                    {/* Expand icon */}
                    <td className="py-3 px-2 text-center text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </tr>

                  {/* Expanded Row Detail */}
                  {isExpanded && (
                    <tr className="bg-slate-50/90 border-b border-slate-200">
                      <td colSpan={9} className="p-4">
                        <div className="bg-white rounded-xl p-3.5 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">Capital Original:</span>
                            <strong className="font-mono text-slate-800">{formatCurrency(row.capital)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Interés Compensatorio:</span>
                            <strong className="font-mono text-slate-800">{formatCurrency(row.intereses_compensatorio)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Punitorios Base:</span>
                            <strong className="font-mono text-rose-700">{formatCurrency(row.punitorios)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">IVA Punitorios Base:</span>
                            <strong className="font-mono text-rose-700">{formatCurrency(row.iva_punitorios)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Gastos / IVA Gastos:</span>
                            <strong className="font-mono text-slate-800">{formatCurrency(row.gastos + row.iva_gastos)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Comercio de Compra:</span>
                            <span className="font-medium text-slate-800">{row.comercio_de_compra || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Fecha Compra:</span>
                            <span className="font-mono text-slate-800">{row.fecha_compra || '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Fórmula Punitorios Promesa:</span>
                            <span className="font-mono text-blue-700 text-[10px]">
                              Cuota &times; ({row.tna_credito}% &times; 1.5)/365 &times; {row.dias_promesa}d &times; 1.21
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
