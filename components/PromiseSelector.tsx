'use client';

import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface Props {
  promiseDays: number;
  onChange: (days: number) => void;
  targetDateStr?: string;
  hasTnaZero?: boolean;
}

const PRESET_DAYS = [0, 1, 2, 3, 5, 7, 10, 15];

export default function PromiseSelector({ promiseDays, onChange, targetDateStr, hasTnaZero }: Props) {
  return (
    <div className={`bg-white rounded-2xl p-5 border shadow-sm transition-all ${
      hasTnaZero ? 'border-red-400 ring-2 ring-red-500/20' : 'border-slate-200'
    }`}>
      {/* Aviso Crítico en ROJO Fuerte si tiene TNA 0% o Vacío */}
      {hasTnaZero && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-start gap-3 shadow-lg shadow-red-600/30 border border-red-700">
          <span className="text-2xl shrink-0">⚠️</span>
          <div className="flex-1">
            <span className="block font-black uppercase tracking-wider text-[11px] text-red-100">
              ¡ATENCIÓN OPERADOR! PROMESA BLOQUEADA
            </span>
            <span className="font-semibold text-white leading-snug block mt-0.5">
              El cliente posee créditos con <strong>TNA 0% o sin tasa informada</strong>. No se pueden otorgar días de promesa. Únicamente se debe liquidar con los datos y montos del <strong>día actual (Hoy)</strong>.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className={`p-2 rounded-xl ${hasTnaZero ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Días de Promesa de Pago {hasTnaZero && <span className="text-red-600 font-black">(Solo Hoy)</span>}
            </h3>
            <p className="text-xs text-slate-500">
              {hasTnaZero ? 'Liquidación fijada al día de hoy por política de tasa 0%' : '¿Para dentro de cuántos días se proyecta el pago?'}
            </p>
          </div>
        </div>

        {targetDateStr && (
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            hasTnaZero
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <Calendar className={`w-4 h-4 ${hasTnaZero ? 'text-red-600' : 'text-emerald-600'}`} />
            <span>Fecha límite: <strong className="font-bold">{targetDateStr}</strong></span>
          </div>
        )}
      </div>

      {/* Buttons and numeric input */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_DAYS.map((days) => {
          const isSelected = promiseDays === days;
          const isDisabled = Boolean(hasTnaZero && days > 0);
          return (
            <button
              key={days}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(days)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? (hasTnaZero
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105')
                  : isDisabled
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed opacity-40 line-through'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {days === 0 ? 'Hoy (0d)' : `+${days} día${days > 1 ? 's' : ''}`}
            </button>
          );
        })}

        {/* Custom input */}
        <div className="flex items-center space-x-1.5 ml-auto">
          <label htmlFor="custom-days" className={`text-xs font-medium ${hasTnaZero ? 'text-slate-300' : 'text-slate-500'}`}>
            Personalizado:
          </label>
          <input
            id="custom-days"
            type="number"
            min="0"
            max="90"
            disabled={Boolean(hasTnaZero)}
            value={promiseDays}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-16 px-2.5 py-1.5 text-center text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
          <span className={`text-xs ${hasTnaZero ? 'text-slate-300' : 'text-slate-500'}`}>días</span>
        </div>
      </div>
    </div>
  );
}
