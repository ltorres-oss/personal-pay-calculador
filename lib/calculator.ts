import { CreditRecord, InstallmentCalculation, SimulationResult, CustomerProfile } from './types';

/**
 * Calcula la actualización de punitorios para una cuota individual según la fórmula exacta de Personal Pay:
 * - Punitorios Promesa = (Cuota Actualizada) * (TNA / 100 * 1.5) / 365 * Días Promesa * 1.21
 * - Deuda c/Promesa = Cuota Actualizada + Punitorios Promesa
 */
export function calculateInstallment(
  credit: CreditRecord,
  promiseDays: number
): InstallmentCalculation {
  const isMora = credit.dias_de_mora > 0;
  const diasPromesa = isMora ? Math.max(0, promiseDays) : 0;
  const moraMasPromesa = isMora ? credit.dias_de_mora + diasPromesa : 0;

  let punitoriosPromesa = 0;
  let deudaActualizadaPromesa = credit.importe_total;

  if (isMora && diasPromesa > 0) {
    const tasaDiaria = (credit.tna_credito / 100 * 1.5) / 365;
    punitoriosPromesa = credit.importe_total * tasaDiaria * diasPromesa * 1.21;
    deudaActualizadaPromesa = credit.importe_total + punitoriosPromesa;
  }

  return {
    ...credit,
    dias_promesa: diasPromesa,
    mora_mas_promesa: moraMasPromesa,
    punitorios_promesa: punitoriosPromesa,
    deuda_actualizada_promesa: deudaActualizadaPromesa,
  };
}

/**
 * Ejecuta la simulación completa para todas las cuotas de un cliente
 */
export function simulateCreditDebt(
  credits: CreditRecord[],
  promiseDays: number
): SimulationResult {
  if (!credits || credits.length === 0) {
    throw new Error('No se encontraron registros de créditos para el CUIL indicado.');
  }

  // Detección de productos con TNA 0 o vacío
  const tnaZeroCredits = credits.filter(
    (c) => c.tna_credito === null || c.tna_credito === undefined || Number(c.tna_credito) <= 0
  );
  const hasTnaZero = tnaZeroCredits.length > 0;
  const tnaZeroCount = tnaZeroCredits.length;

  // Si tiene productos con TNA 0 o vacío, no se pueden calcular días de promesa (se fija obligatoriamente en 0)
  const safePromiseDays = hasTnaZero ? 0 : Math.max(0, Math.floor(promiseDays || 0));
  const calculatedInstallments = credits.map((c) =>
    calculateInstallment(c, safePromiseDays)
  );

  // Cálculos agregados
  const montoTotal = calculatedInstallments.reduce((acc, c) => acc + c.importe_total, 0);
  const montoActualizado = calculatedInstallments.reduce(
    (acc, c) => acc + c.deuda_actualizada_promesa,
    0
  );
  const totalPunitoriosBase = calculatedInstallments.reduce((acc, c) => acc + c.punitorios, 0);
  const totalIvaPunitoriosBase = calculatedInstallments.reduce(
    (acc, c) => acc + c.iva_punitorios,
    0
  );
  
  // Reintegro según Excel: Punitorios Base + IVA Punitorios Base + (Monto Actualizado - Monto Total)
  const totalNuevosPunitorios = montoActualizado - montoTotal;
  const reintegro = totalPunitoriosBase + totalIvaPunitoriosBase + totalNuevosPunitorios;
  const montoFinal = montoActualizado - reintegro;

  // Extraer datos representativos del cliente
  const first = credits[0];
  const maxMora = Math.max(...credits.map((c) => c.dias_de_mora || 0));
  const cuotasEnMora = credits.filter((c) => c.dias_de_mora > 0).length;

  const now = new Date();
  const fechaPromesa = new Date(now.getTime() + safePromiseDays * 24 * 60 * 60 * 1000);

  const customer: CustomerProfile = {
    cuil: first.cuil,
    document_number: first.document_number || '',
    full_name: (first.first_name + ' ' + first.last_name).trim(),
    email: first.email || '',
    phone: String(first.phone_number || first.phone_number_164 || ''),
    city: first.city || '',
    province: first.province || '',
    total_credits: new Set(credits.map((c) => c.nro_credito)).size,
    max_dias_mora: maxMora,
  };

  return {
    customer,
    dias_promesa: safePromiseDays,
    fecha_simulacion: now.toISOString(),
    fecha_vencimiento_promesa: fechaPromesa.toISOString().split('T')[0],
    has_tna_zero: hasTnaZero,
    tna_zero_count: tnaZeroCount,
    summary: {
      monto_total: montoTotal,
      monto_actualizado: montoActualizado,
      reintegro: reintegro,
      monto_final: montoFinal,
      total_punitorios_base: totalPunitoriosBase,
      total_iva_punitorios_base: totalIvaPunitoriosBase,
      total_nuevos_punitorios: totalNuevosPunitorios,
      total_cuotas: credits.length,
      cuotas_en_mora: cuotasEnMora,
    },
    cuotas: calculatedInstallments,
  };
}

/**
 * Formateador de moneda argentina ($ 1.234,56)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
