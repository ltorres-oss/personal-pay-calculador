'use client';

import React, { useState } from 'react';
import { SimulationResult } from '@/lib/types';
import { formatCurrency } from '@/lib/calculator';
import { Copy, Check, MessageSquare, PhoneCall } from 'lucide-react';

interface Props {
  simulation: SimulationResult;
}

export default function QuickOfferCopy({ simulation }: Props) {
  const [copied, setCopied] = useState(false);
  const { customer, summary, dias_promesa, fecha_vencimiento_promesa } = simulation;

  const generateMessage = () => {
    const saludo = customer.full_name ? `Estimado/a ${customer.full_name}` : 'Estimado/a cliente';
    const fechaCompromiso = simulation.has_tna_zero
      ? `📅 Fecha límite de compromiso de pago: *HOY MISMO (${fecha_vencimiento_promesa})* (⚠️ Liquidación válida exclusivamente para el día de la fecha).\n`
      : `📅 Fecha límite de compromiso de pago: *${fecha_vencimiento_promesa}* (${dias_promesa} día/s de promesa).\n`;

    return (
      `${saludo}, le contactamos de Personal Pay en relación a sus obligaciones pendientes (CUIL: ${customer.cuil}).\n\n` +
      `Le acercamos una *propuesta exclusiva de cancelación con bonificación total de punitorios*:\n` +
      `📌 Deuda simulada con intereses: ${formatCurrency(summary.monto_actualizado)}\n` +
      `🎁 Bonificación de Punitorios (100%): - ${formatCurrency(summary.reintegro)}\n` +
      `👉 *MONTO FINAL A ABONAR: ${formatCurrency(summary.monto_final)}*\n\n` +
      fechaCompromiso +
      `Por favor responda este mensaje con el comprobante una vez realizada la transferencia para aplicar la bonificación.`
    );
  };

  const handleCopy = () => {
    const text = generateMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const cleanPhone = String(customer?.phone || '').replace(/[^0-9]/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/549${cleanPhone}?text=${encodeURIComponent(generateMessage())}`
    : null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Propuesta para WhatsApp / Llamada
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-semibold shadow-sm transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Abrir WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs text-slate-600 font-mono whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
        {generateMessage()}
      </div>
    </div>
  );
}
