'use client';

import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface Props {
  promiseDays: number;
  onChange: (days: number) => void;
  targetDateStr?: string;
}

const PRESET_DAYS = [0, 1, 2, 3, 5, 7, 10, 15];

export default function PromiseSelector({ promiseDays, onChange, targetDateStr }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Días de Promesa de Pago</h3>
            <p className="text-xs text-slate-500">¿Para dentro de cuántos días se proyecta el pago?</p>
          </div>
        </div>

        {targetDateStr && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Fecha límite: <strong className="font-bold">{targetDateStr}</strong></span>
          </div>
        )}
      </div>

      {/* Buttons and numeric input */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_DAYS.map((days) => {
          const isSelected = promiseDays === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => onChange(days)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {days === 0 ? 'Hoy (0d)' : `+${days} día${days > 1 ? 's' : ''}`}
            </button>
          );
        })}

        {/* Custom input */}
        <div className="flex items-center space-x-1.5 ml-auto">
          <label htmlFor="custom-days" className="text-xs text-slate-500 font-medium">
            Personalizado:
          </label>
          <input
            id="custom-days"
            type="number"
            min="0"
            max="90"
            value={promiseDays}
            onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-16 px-2.5 py-1.5 text-center text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
          />
          <span className="text-xs text-slate-500">días</span>
        </div>
      </div>
    </div>
  );
}
