import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { CreditRecord, BaseMetadata, AuthorizedUser, SimulationHistoryRecord } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

let sqliteDbInstance: DatabaseSync | null = null;

function getSqliteDb(): DatabaseSync {
  if (!sqliteDbInstance) {
    const dbPath = path.join(process.cwd(), 'personal_pay.db');
    sqliteDbInstance = new DatabaseSync(dbPath);
    sqliteDbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return sqliteDbInstance;
}

export function cleanDoc(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/**
 * Busca créditos por CUIL o DNI (Soporte dual Supabase / SQLite)
 */
export async function getCreditsByCuilOrDni(query: string): Promise<CreditRecord[]> {
  const clean = cleanDoc(query);
  if (!clean) return [];

  const supabase = getSupabaseClient();
  if (supabase) {
    // 1. Buscar por CUIL exacto en Supabase
    let { data, error } = await supabase
      .from('credits')
      .select('*')
      .eq('cuil', clean)
      .order('nro_cuota', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as CreditRecord[];
    }

    // 2. Si no hay por CUIL, buscar por DNI
    const { data: dniData, error: dniError } = await supabase
      .from('credits')
      .select('*')
      .eq('document_number', clean)
      .order('nro_cuota', { ascending: true });

    if (!dniError && dniData) {
      return dniData as CreditRecord[];
    }
    return [];
  }

  // Fallback SQLite local
  const db = getSqliteDb();
  let stmt = db.prepare('SELECT * FROM credits WHERE cuil = ? ORDER BY nro_cuota ASC, id ASC');
  let rows = stmt.all(clean) as unknown as CreditRecord[];

  if (rows.length === 0) {
    stmt = db.prepare('SELECT * FROM credits WHERE document_number = ? ORDER BY nro_cuota ASC, id ASC');
    rows = stmt.all(clean) as unknown as CreditRecord[];
  }

  return rows;
}

/**
 * Autocompletado / sugerencias de búsqueda
 */
export async function searchClientSuggestions(term: string): Promise<any[]> {
  const clean = term.trim();
  if (clean.length < 2) return [];

  const supabase = getSupabaseClient();
  if (supabase) {
    const numericOnly = cleanDoc(clean);
    if (numericOnly.length >= 2) {
      const { data } = await supabase
        .from('credits')
        .select('cuil, document_number, first_name, last_name, importe_total')
        .or(`cuil.ilike.${numericOnly}%,document_number.ilike.${numericOnly}%`)
        .limit(25);
      
      return aggregateSuggestions(data || []);
    } else {
      const { data } = await supabase
        .from('credits')
        .select('cuil, document_number, first_name, last_name, importe_total')
        .or(`last_name.ilike.${clean.toUpperCase()}%,first_name.ilike.${clean.toUpperCase()}%`)
        .limit(25);

      return aggregateSuggestions(data || []);
    }
  }

  // Fallback SQLite
  const db = getSqliteDb();
  const numericOnly = cleanDoc(clean);
  if (numericOnly.length >= 2) {
    const stmt = db.prepare(
      'SELECT cuil, document_number, first_name, last_name, count(*) as total_cuotas, sum(importe_total) as deuda_total ' +
      'FROM credits ' +
      'WHERE cuil LIKE ? OR document_number LIKE ? ' +
      'GROUP BY cuil ' +
      'LIMIT 8'
    );
    const param = numericOnly + '%';
    return stmt.all(param, param) as any[];
  } else {
    const stmt = db.prepare(
      'SELECT cuil, document_number, first_name, last_name, count(*) as total_cuotas, sum(importe_total) as deuda_total ' +
      'FROM credits ' +
      'WHERE last_name LIKE ? OR first_name LIKE ? ' +
      'GROUP BY cuil ' +
      'LIMIT 8'
    );
    const param = clean.toUpperCase() + '%';
    return stmt.all(param, param) as any[];
  }
}

function aggregateSuggestions(rows: any[]) {
  const map = new Map<string, any>();
  for (const r of rows) {
    if (!map.has(r.cuil)) {
      map.set(r.cuil, {
        cuil: r.cuil,
        document_number: r.document_number,
        first_name: r.first_name,
        last_name: r.last_name,
        total_cuotas: 1,
        deuda_total: Number(r.importe_total || 0),
      });
    } else {
      const existing = map.get(r.cuil);
      existing.total_cuotas += 1;
      existing.deuda_total += Number(r.importe_total || 0);
    }
  }
  return Array.from(map.values()).slice(0, 8);
}

/**
 * Obtiene metadatos de la base activa
 */
export async function getBaseMetadata(): Promise<BaseMetadata | null> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('base_metadata')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return {
        id: data.id,
        filename: data.filename,
        total_records: data.total_records,
        total_unique_cuils: data.total_unique_cuils,
        imported_at: data.imported_at,
        is_active: data.is_active ? 1 : 0,
      };
    }
    return null;
  }

  const db = getSqliteDb();
  const stmt = db.prepare('SELECT * FROM base_metadata WHERE is_active = 1 ORDER BY id DESC LIMIT 1');
  const meta = stmt.get() as unknown as BaseMetadata | undefined;
  return meta || null;
}

/**
 * Lista de usuarios autorizados
 */
export async function getAuthorizedUsers(): Promise<AuthorizedUser[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase.from('users').select('*').order('id', { ascending: true });
    if (data) {
      return data.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        is_active: u.is_active ? 1 : 0,
        invited_by: u.invited_by,
        invited_at: u.created_at,
        last_login_at: u.last_login_at,
      }));
    }
    return [];
  }

  const db = getSqliteDb();
  const stmt = db.prepare('SELECT * FROM authorized_users ORDER BY id ASC');
  return stmt.all() as unknown as AuthorizedUser[];
}

export async function addAuthorizedUser(
  email: string,
  name: string,
  role: 'admin' | 'operador' = 'operador',
  invitedBy = 'admin'
) {
  const cleanEmail = email.toLowerCase().trim();
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('users').insert({
      email: cleanEmail,
      name: name.trim(),
      role,
      is_active: true,
      invited_by: invitedBy,
    });
    return;
  }

  const db = getSqliteDb();
  const stmt = db.prepare(
    'INSERT INTO authorized_users (email, name, role, is_active, invited_by) VALUES (?, ?, ?, 1, ?)'
  );
  stmt.run(cleanEmail, name.trim(), role, invitedBy);
}

export async function toggleUserStatus(id: number) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase.from('users').select('is_active').eq('id', id).single();
    if (data) {
      await supabase.from('users').update({ is_active: !data.is_active }).eq('id', id);
    }
    return;
  }

  const db = getSqliteDb();
  const stmt = db.prepare('UPDATE authorized_users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?');
  stmt.run(id);
}

export async function deleteAuthorizedUser(id: number) {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('users').delete().eq('id', id);
    return;
  }

  const db = getSqliteDb();
  const stmt = db.prepare('DELETE FROM authorized_users WHERE id = ?');
  stmt.run(id);
}

/**
 * Registra una simulación en el historial de auditoría / backlog
 */
export async function recordSimulation(sim: {
  cuil: string;
  clientName: string;
  operatorEmail?: string;
  operatorName?: string;
  diasPromesa: number;
  totalCuotas: number;
  montoTotal: number;
  montoActualizado: number;
  reintegro: number;
  montoFinal: number;
}) {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('simulation_history').insert({
      cuil: sim.cuil,
      client_name: sim.clientName,
      operator_email: sim.operatorEmail || 'operador@personalpay.com.ar',
      operator_name: sim.operatorName || 'Operador',
      dias_promesa: sim.diasPromesa,
      total_cuotas: sim.totalCuotas,
      monto_total_original: sim.montoTotal,
      deuda_con_promesa: sim.montoActualizado,
      calculo_reintegro: sim.reintegro,
      monto_final_pago_deuda: sim.montoFinal,
    });
    return;
  }

  const db = getSqliteDb();
  const stmt = db.prepare(
    'INSERT INTO simulation_history (' +
    'cuil, client_name, operator_email, dias_promesa, total_cuotas, ' +
    'monto_total, monto_actualizado, reintegro, monto_final' +
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    sim.cuil,
    sim.clientName,
    sim.operatorEmail || 'operador@personalpay.com.ar',
    sim.diasPromesa,
    sim.totalCuotas,
    sim.montoTotal,
    sim.montoActualizado,
    sim.reintegro,
    sim.montoFinal
  );
}

/**
 * Obtiene el backlog completo de consultas para auditoría
 */
export async function getQueryBacklog(limit = 100): Promise<SimulationHistoryRecord[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('simulation_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data) {
      return data.map((d: any) => ({
        id: d.id,
        cuil: d.cuil,
        client_name: d.client_name,
        operator_email: d.operator_email,
        dias_promesa: d.dias_promesa,
        total_cuotas: d.total_cuotas,
        monto_total: Number(d.monto_total_original || d.monto_total || 0),
        monto_actualizado: Number(d.deuda_con_promesa || d.monto_actualizado || 0),
        reintegro: Number(d.calculo_reintegro || d.reintegro || 0),
        monto_final: Number(d.monto_final_pago_deuda || d.monto_final || 0),
        created_at: d.created_at,
      }));
    }
    return [];
  }

  const db = getSqliteDb();
  const stmt = db.prepare('SELECT * FROM simulation_history ORDER BY id DESC LIMIT ?');
  return stmt.all(limit) as unknown as SimulationHistoryRecord[];
}

/**
 * =====================================================================
 * INGESTA Y REEMPLAZO TOTAL DE BASE DIARIA
 * =====================================================================
 */

/**
 * Paso 1: Inicializa la subida y vacía por completo la tabla anterior
 */
export async function initDailyBaseUpload(filename: string, totalRowsExpected: number): Promise<{ metadataId: number }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    // 1. Borrado completo en Supabase
    const { error: truncError } = await supabase.rpc('truncate_and_prepare_credits');
    if (truncError) {
      // Si la función RPC no existe, hacer DELETE FROM credits
      await supabase.from('credits').delete().neq('id', 0);
      await supabase.from('base_metadata').update({ is_active: false }).eq('is_active', true);
    }

    // 2. Crear metadatos provisionales
    const { data, error } = await supabase
      .from('base_metadata')
      .insert({
        filename,
        total_records: totalRowsExpected,
        total_unique_cuils: 0,
        is_active: false,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error('Error inicializando base en Supabase: ' + (error?.message || ''));
    }
    return { metadataId: data.id };
  }

  // SQLite local
  const db = getSqliteDb();
  db.exec('BEGIN TRANSACTION;');
  db.exec('DELETE FROM credits;');
  db.exec('UPDATE base_metadata SET is_active = 0 WHERE is_active = 1;');
  const stmt = db.prepare(
    'INSERT INTO base_metadata (filename, total_records, total_unique_cuils, is_active) VALUES (?, ?, 0, 0)'
  );
  const info = stmt.run(filename, totalRowsExpected);
  db.exec('COMMIT;');
  return { metadataId: Number(info.lastInsertRowid) };
}

/**
 * Paso 2: Inserta un lote de registros (2.500 cuotas)
 */
export async function insertDailyBaseBatch(records: any[]): Promise<{ inserted: number }> {
  if (!records || records.length === 0) return { inserted: 0 };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from('credits').insert(records);
    if (error) {
      throw new Error('Error insertando lote en Supabase: ' + error.message);
    }
    return { inserted: records.length };
  }

  // SQLite local
  const db = getSqliteDb();
  const insertSql = 
    'INSERT INTO credits (' +
    'agencia, id_comercio, cuil, articulo, nro_credito, id_solicitud, nro_cuota, ' +
    'fecha_compra, total_cuotas, capital, intereses_compensatorio, intereses_devengado, ' +
    'iva_intereses_compensatorio, gastos, iva_gastos, punitorios, iva_punitorios, importe_total, ' +
    'proximo_vto, dias_de_mora, fecha_cobro, first_name, last_name, email, ' +
    'rango_etario, edad, flag_empleado, city, province, document_number, ' +
    'codigo_riesgo, phone_number, phone_number_164, flag_deudor_extrapay, ' +
    'tna_credito, comercio_de_compra, convergencia, repeaters, nse, bk, ' +
    'max_dias_mora_por_cuil, bk_automatico, tipo_producto, fecha_asignacion, ' +
    'fecha_fin_asignacion, n_nomina' +
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

  db.exec('BEGIN TRANSACTION;');
  const stmt = db.prepare(insertSql);
  for (const r of records) {
    stmt.run(
      r.agencia || '', r.id_comercio || '', String(r.cuil || ''), r.articulo || '',
      r.nro_credito || '', r.id_solicitud || '', Number(r.nro_cuota || 0),
      r.fecha_compra || '', Number(r.total_cuotas || 0), Number(r.capital || 0),
      Number(r.intereses_compensatorio || 0), Number(r.intereses_devengado || 0),
      Number(r.iva_intereses_compensatorio || 0), Number(r.gastos || 0),
      Number(r.iva_gastos || 0), Number(r.punitorios || 0), Number(r.iva_punitorios || 0),
      Number(r.importe_total || 0), r.proximo_vto || '', Number(r.dias_de_mora || 0),
      r.fecha_cobro || '', r.first_name || '', r.last_name || '', r.email || '',
      r.rango_etario || '', Number(r.edad || 0), r.flag_empleado || '',
      r.city || '', r.province || '', String(r.document_number || ''),
      r.codigo_riesgo || '', r.phone_number || '', r.phone_number_164 || '',
      r.flag_deudor_extrapay || '', Number(r.tna_credito || 0), r.comercio_de_compra || '',
      r.convergencia || '', r.repeaters || '', r.nse || '', r.bk || '',
      Number(r.max_dias_mora_por_cuil || 0), r.bk_automatico || '',
      r.tipo_producto || '', r.fecha_asignacion || '', r.fecha_fin_asignacion || '',
      r.n_nomina || ''
    );
  }
  db.exec('COMMIT;');
  return { inserted: records.length };
}

/**
 * Paso 3: Finaliza la subida, cuenta CUILs únicos y activa la base
 */
export async function finishDailyBaseUpload(metadataId: number): Promise<{ success: boolean; totalUniqueCuils: number }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    // Contar registros y cuils
    const { count: totalRecs } = await supabase.from('credits').select('*', { count: 'exact', head: true });
    
    // Activar metadata
    await supabase
      .from('base_metadata')
      .update({
        total_records: totalRecs || 0,
        is_active: true,
      })
      .eq('id', metadataId);

    return { success: true, totalUniqueCuils: 0 };
  }

  // SQLite local
  const db = getSqliteDb();
  const countRow = db.prepare('SELECT count(*), count(DISTINCT cuil) FROM credits').get() as any;
  const totalRecords = countRow['count(*)'] || 0;
  const uniqueCuils = countRow['count(DISTINCT cuil)'] || 0;

  db.prepare(
    'UPDATE base_metadata SET total_records = ?, total_unique_cuils = ?, is_active = 1 WHERE id = ?'
  ).run(totalRecords, uniqueCuils, metadataId);

  return { success: true, totalUniqueCuils: uniqueCuils };
}

export const getRecentSimulations = getQueryBacklog;
