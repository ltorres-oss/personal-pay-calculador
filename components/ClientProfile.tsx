import React from 'react';
import { CustomerProfile } from '@/lib/types';
import { User, Phone, Mail, MapPin, CreditCard, AlertTriangle } from 'lucide-react';

interface Props {
  customer: CustomerProfile;
}

export default function ClientProfile({ customer }: Props) {
  const cleanPhone = String(customer?.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
            {customer.full_name ? customer.full_name.charAt(0) : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {customer.full_name || 'Titular sin nombre'}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Titular PPAY
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
              <span>CUIL: <strong className="text-slate-800 font-bold">{customer.cuil}</strong></span>
              {customer.document_number && (
                <>
                  <span>&bull;</span>
                  <span>DNI: <strong className="text-slate-800 font-bold">{customer.document_number}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Créditos</span>
              <strong className="text-slate-900 text-sm">{customer.total_credits} crédito(s)</strong>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200/70 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <div>
              <span className="text-rose-500 block text-[10px] uppercase font-bold">Mora Máxima</span>
              <strong className="text-rose-700 text-sm">{customer.max_dias_mora} días</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-1 text-xs text-slate-600">
        <div className="flex items-center space-x-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <Phone className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-medium">Teléfono de contacto</span>
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
              >
                {customer.phone}
              </a>
            ) : (
              <span className="text-slate-400 italic">No informado</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <Mail className="w-4 h-4 text-cyan-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-medium">Correo Electrónico</span>
            {customer.email ? (
              <a
                href={`mailto:${customer.email}`}
                className="font-medium text-slate-900 hover:text-blue-600 hover:underline truncate block"
              >
                {customer.email}
              </a>
            ) : (
              <span className="text-slate-400 italic">No informado</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="truncate">
            <span className="text-[10px] text-slate-400 block font-medium">Ubicación</span>
            <span className="font-medium text-slate-900 truncate block">
              {customer.city ? `${customer.city}, ${customer.province}` : customer.province || 'No informada'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
