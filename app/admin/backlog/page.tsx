'use client';

import React, { useEffect, useState } from 'react';
import { SimulationHistoryRecord } from '@/lib/types';
import { formatCurrency } from '@/lib/calculator';
import { ClipboardList, Search, Download, Calendar, User, DollarSign, Filter } from 'lucide-react';

export default function BacklogPage() {
  const [backlog, setBacklog] = useState<SimulationHistoryRecord[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBacklog = () => {
    setLoading(true);
    fetch('/api/backlog?limit=200')
      .then((res) => res.json())
      .then((data) => {
        if (data.backlog) setBacklog(data.backlog);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBacklog();
  }, []);

  const filtered = backlog.filter((item) => {
    if (!filter.trim()) return true;
    const term = filter.toLowerCase();
    return (
      item.cuil.toLowerCase().includes(term) ||
      (item.client_name && item.client_name.toLowerCase().includes(term)) ||
      (item.operator_email && item.operator_email.toLowerCase().includes(term))
    );
  });

  const totalMontoOriginal = filtered.reduce((acc, i) => acc + (i.monto_total || 0), 0);
  const totalMontoFinal = filtered.reduce((acc, i) => acc + (i.monto_final || 0), 0);
  const totalReintegros = filtered.reduce((acc, i) => acc + (i.reintegro || 0), 0);

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const headers = [
      'ID', 'Fecha/Hora', 'Operador', 'CUIL', 'Titular', 'Dias Promesa',
      'Cuotas', 'Monto Total Original', 'Deuda c/Promesa', 'Calculo Reintegro', 'Monto Final Pago'
    ];
    const rows = filtered.map((i) => [
      i.id,
      i.created_at,
      i.operator_email,
      i.cuil,
      `"${(i.client_name || '').replace(/"/g, '""')}"`,
      i.dias_promesa,
      i.total_cuotas,
      i.monto_total,
      i.monto_actualizado,
      i.reintegro,
      i.monto_final
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `backlog_consultas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <span>Backlog de Consultas y Auditoría</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro histórico de cada simulación realizada por los operadores en la plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a Excel / CSV</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Consultas</span>
          <strong className="text-2xl font-mono text-slate-900 mt-1 block">{filtered.length}</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Deuda Total Consultada</span>
          <strong className="text-xl font-mono text-slate-900 mt-1 block">{formatCurrency(totalMontoOriginal)}</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Reintegros Bonificados</span>
          <strong className="text-xl font-mono text-purple-900 mt-1 block">-{formatCurrency(totalReintegros)}</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Neto a Cobrar</span>
          <strong className="text-2xl font-mono text-emerald-700 mt-1 block">{formatCurrency(totalMontoFinal)}</strong>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por CUIL, titular u operador..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">Mostrando {filtered.length} registros</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-3">Operador</th>
                <th className="py-3 px-4">CUIL & Titular</th>
                <th className="py-3 px-2 text-center">Días</th>
                <th className="py-3 px-3 text-right">Monto Original</th>
                <th className="py-3 px-3 text-right">Deuda c/Promesa</th>
                <th className="py-3 px-3 text-right text-purple-700">Reintegro</th>
                <th className="py-3 px-4 text-right font-bold text-emerald-700">Monto Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {row.created_at ? row.created_at.replace('T', ' ').slice(0, 16) : '-'}
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      {row.operator_email.split('@')[0]}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-900">
                    <div className="font-bold">{row.client_name || 'Sin nombre'}</div>
                    <span className="font-mono text-slate-400 text-[11px]">CUIL: {row.cuil} ({row.total_cuotas} cuotas)</span>
                  </td>

                  <td className="py-3 px-2 text-center font-mono font-bold text-blue-700">
                    +{row.dias_promesa}d
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-medium">
                    {formatCurrency(row.monto_total)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-semibold text-blue-900">
                    {formatCurrency(row.monto_actualizado)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-medium text-purple-700">
                    -{formatCurrency(row.reintegro)}
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                    {formatCurrency(row.monto_final)}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron consultas registradas en el backlog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
