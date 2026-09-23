'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Database, UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2, ArrowRight } from 'lucide-react';

export default function BaseManagerPage() {
  const [metadata, setMetadata] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMeta = () => {
    fetch('/api/metadata')
      .then((res) => res.json())
      .then((data) => {
        if (data.metadata) setMetadata(data.metadata);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setErrorMsg(null);
    setSuccessMsg(null);
    setStatusText('1. Leyendo archivo Excel en memoria...');

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      // Buscar hoja Caida Diaria AG-2 o primera hoja
      const sheetName = wb.SheetNames.find((s) => s.includes('Caida') || s.includes('Diaria')) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        throw new Error('No se encontró una hoja válida de Caída Diaria en el archivo.');
      }

      setStatusText('2. Parseando registros...');
      const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
      if (!rawRows || rawRows.length === 0) {
        throw new Error('El archivo no contiene filas de datos.');
      }

      const totalRows = rawRows.length;
      setStatusText(`3. Inicializando y borrando base anterior (${totalRows.toLocaleString('es-AR')} filas detectadas)...`);
      setProgress(5);

      // Iniciar subida (Borra por completo la base anterior)
      const initRes = await fetch('/api/base/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, totalRows }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) {
        throw new Error(initData.error || 'Error al vaciar y preparar la base de datos.');
      }

      const metadataId = initData.metadataId;

      // Transformar filas a formato de la base
      const formattedRecords = rawRows.map((r: any) => {
        const cleanCuil = String(r.cuil ?? r.CUIL ?? r.Cuil ?? '').replace(/\.0$/, '').trim();
        const cleanDoc = String(r.document_number ?? r.Document_number ?? r.DNI ?? r.dni ?? '').replace(/\.0$/, '').trim();

        return {
          agencia: String(r.agencia ?? ''),
          id_comercio: String(r.IdComercio ?? r.id_comercio ?? ''),
          cuil: cleanCuil,
          articulo: String(r.Articulo ?? r.articulo ?? ''),
          nro_credito: String(r.NroCredito ?? r.nro_credito ?? ''),
          id_solicitud: String(r.IdSolicitud ?? r.id_solicitud ?? ''),
          nro_cuota: Number(r.NroCuota ?? r.nro_cuota ?? 0),
          fecha_compra: String(r.FechaCompra ?? r.fecha_compra ?? ''),
          total_cuotas: Number(r.TotalCuotas ?? r.total_cuotas ?? 0),
          capital: Number(r.Capital ?? r.capital ?? 0),
          intereses_compensatorio: Number(r.InteresesCompensatorio ?? r.intereses_compensatorio ?? 0),
          intereses_devengado: Number(r.InteresesDevengado ?? r.intereses_devengado ?? 0),
          iva_intereses_compensatorio: Number(r.IVAIntereses ?? r.iva_intereses ?? 0),
          gastos: Number(r.Gastos ?? r.gastos ?? 0),
          iva_gastos: Number(r.IVAGastos ?? r.iva_gastos ?? 0),
          punitorios: Number(r.Punitorios ?? r.punitorios ?? 0),
          iva_punitorios: Number(r.IVAPunitorios ?? r.iva_punitorios ?? 0),
          importe_total: Number(r.ImporteTotal ?? r.importe_total ?? 0),
          proximo_vto: String(r.ProximoVto ?? r.proximo_vto ?? ''),
          dias_de_mora: Number(r.DiasDeMora ?? r.dias_de_mora ?? 0),
          fecha_cobro: String(r.FechaCobro ?? r.fecha_cobro ?? ''),
          first_name: String(r.First_name ?? r.first_name ?? ''),
          last_name: String(r.Last_name ?? r.last_name ?? ''),
          email: String(r.Email ?? r.email ?? ''),
          rango_etario: String(r.rango_etario ?? ''),
          edad: Number(r.edad ?? 0),
          flag_empleado: String(r.Flag_empleado ?? ''),
          city: String(r.City ?? r.city ?? ''),
          province: String(r.Province ?? r.province ?? ''),
          document_number: cleanDoc,
          codigo_riesgo: String(r.codigo_riesgo ?? ''),
          phone_number: String(r.Phone_number ?? r.phone_number ?? ''),
          phone_number_164: String(r.Phone_number_164 ?? r.phone_number_164 ?? ''),
          flag_deudor_extrapay: String(r.Flag_deudor_extrapay ?? ''),
          tna_credito: Number(r.TNA_CREDITO ?? r.tna_credito ?? 0),
          comercio_de_compra: String(r.Comercio_de_compra ?? ''),
          convergencia: String(r.Convergencia ?? ''),
          repeaters: String(r.Repeaters ?? ''),
          nse: String(r.nse ?? ''),
          bk: String(r.BK ?? ''),
          max_dias_mora_por_cuil: Number(r.max_dias_mora_por_cuil ?? 0),
          bk_automatico: String(r.bk_automatico ?? ''),
          tipo_producto: String(r.Tipo_Producto ?? ''),
          fecha_asignacion: String(r.fecha_asignacion ?? ''),
          fecha_fin_asignacion: String(r.fecha_fin_asignacion ?? ''),
          n_nomina: String(r.N_nomina ?? ''),
        };
      }).filter((item) => item.cuil.length > 0);

      const BATCH_SIZE = 2500;
      const totalBatches = Math.ceil(formattedRecords.length / BATCH_SIZE);

      for (let i = 0; i < totalBatches; i++) {
        const batch = formattedRecords.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
        const batchNum = i + 1;

        setStatusText(`4. Insertando lote ${batchNum} de ${totalBatches} (${batch.length} filas)...`);

        const batchRes = await fetch('/api/base/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: batch }),
        });

        if (!batchRes.ok) {
          const errData = await batchRes.json();
          throw new Error(errData.error || `Error en lote ${batchNum}`);
        }

        const pct = Math.round(10 + (batchNum / totalBatches) * 85);
        setProgress(pct);
      }

      setStatusText('5. Finalizando y activando base de datos...');
      const finishRes = await fetch('/api/base/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadataId }),
      });
      const finishData = await finishRes.json();
      if (!finishRes.ok) {
        throw new Error(finishData.error || 'Error al activar la base.');
      }

      setProgress(100);
      setStatusText('¡Completado con éxito!');
      setSuccessMsg(
        `Base diaria actualizada: se borró la información previa y se cargaron ${formattedRecords.length.toLocaleString('es-AR')} registros exitosamente.`
      );
      fetchMeta();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error procesando el archivo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gestión y Carga de Base de Datos Diaria
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sube un nuevo archivo Excel para <strong>reemplazar completamente</strong> la base de créditos en Supabase o en el servidor.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Subir Nueva Caída Diaria</h3>
            <p className="text-xs text-slate-500">
              Arrastra o selecciona el archivo Excel (.xlsx). El sistema borrará la base anterior e insertará la nueva en segundos.
            </p>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            uploading
              ? 'border-blue-300 bg-blue-50/40 pointer-events-none'
              : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="space-y-3 max-w-md mx-auto">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800">{statusText}</div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-mono font-bold">{progress}%</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800">
                Haz clic para seleccionar el Excel o arrástralo aquí
              </div>
              <p className="text-xs text-slate-400">
                Soporta archivos de más de 50.000 filas (.xlsx de Personal Pay con hoja Caida Diaria AG-2)
              </p>
            </div>
          )}
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Active Base Status Card */}
      {metadata && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Base Activa en Producción</h3>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Estado: Operativa y Reemplazada
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              Base de Datos Conectada
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Archivo Activo</span>
              <strong className="text-slate-800 text-sm font-mono block mt-1 truncate">
                {metadata.filename}
              </strong>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Registros Totales</span>
              <strong className="text-slate-900 text-xl font-mono block mt-1">
                {metadata.total_records.toLocaleString('es-AR')}
              </strong>
              <span className="text-[11px] text-slate-400">
                {metadata.total_unique_cuils ? metadata.total_unique_cuils.toLocaleString('es-AR') + ' CUILs únicos' : 'Créditos vigentes'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 block font-medium">Fecha de Última Actualización</span>
              <strong className="text-slate-800 text-sm font-mono block mt-1">
                {metadata.imported_at ? new Date(metadata.imported_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' hs' : 'No registrada'}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
