export interface CreditRecord {
  id: number;
  agencia: string;
  id_comercio: string;
  cuil: string;
  articulo: string;
  nro_credito: string;
  id_solicitud: string;
  nro_cuota: number;
  fecha_compra: string;
  total_cuotas: number;
  capital: number;
  intereses_compensatorio: number;
  intereses_devengado: number;
  iva_intereses_compensatorio: number;
  gastos: number;
  iva_gastos: number;
  punitorios: number;
  iva_punitorios: number;
  importe_total: number;
  proximo_vto: string;
  dias_de_mora: number;
  fecha_cobro: string;
  first_name: string;
  last_name: string;
  email: string;
  rango_etario: string;
  edad: number;
  flag_empleado: string;
  city: string;
  province: string;
  document_number: string;
  codigo_riesgo: string;
  phone_number: string;
  phone_number_164: string;
  flag_deudor_extrapay: string;
  tna_credito: number;
  comercio_de_compra: string;
  convergencia: string;
  repeaters: string;
  nse: string;
  bk: string;
  max_dias_mora_por_cuil: number;
  bk_automatico: string;
  tipo_producto: string;
  fecha_asignacion: string;
  fecha_fin_asignacion: string;
  n_nomina: string;
}

export interface InstallmentCalculation extends CreditRecord {
  dias_promesa: number;
  mora_mas_promesa: number;
  punitorios_promesa: number;
  deuda_actualizada_promesa: number;
}

export interface CustomerProfile {
  cuil: string;
  document_number: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  total_credits: number;
  max_dias_mora: number;
}

export interface SimulationResult {
  customer: CustomerProfile;
  dias_promesa: number;
  fecha_simulacion: string;
  fecha_vencimiento_promesa: string;
  has_tna_zero: boolean;
  tna_zero_count: number;
  summary: {
    monto_total: number;
    monto_actualizado: number;
    reintegro: number;
    monto_final: number;
    total_punitorios_base: number;
    total_iva_punitorios_base: number;
    total_nuevos_punitorios: number;
    total_cuotas: number;
    cuotas_en_mora: number;
  };
  cuotas: InstallmentCalculation[];
}

export interface AuthorizedUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'operador';
  is_active: number;
  invited_by: string;
  invited_at: string;
  last_login_at: string | null;
}

export interface BaseMetadata {
  id: number;
  filename: string;
  total_records: number;
  total_unique_cuils: number;
  imported_at: string;
  is_active: number;
}

export interface SimulationHistoryRecord {
  id: number;
  cuil: string;
  client_name: string;
  operator_email: string;
  dias_promesa: number;
  total_cuotas: number;
  monto_total: number;
  monto_actualizado: number;
  reintegro: number;
  monto_final: number;
  created_at: string;
}
