import { NextRequest, NextResponse } from 'next/server';
import { getCreditsByCuilOrDni, recordSimulation } from '@/lib/db';
import { simulateCreditDebt } from '@/lib/calculator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('cuil') || searchParams.get('q') || '';
    const promiseDaysParam = searchParams.get('promise_days') ?? searchParams.get('dias') ?? '0';
    const promiseDays = parseInt(promiseDaysParam, 10) || 0;
    const operatorEmail = searchParams.get('operator') || 'operador@personalpay.com.ar';

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Debe ingresar un CUIL o DNI para simular.' },
        { status: 400 }
      );
    }

    const credits = await getCreditsByCuilOrDni(query);

    if (!credits || credits.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron créditos registrados para el documento o CUIL: ' + query },
        { status: 404 }
      );
    }

    // Ejecutar simulación matemática
    const result = simulateCreditDebt(credits, promiseDays);

    // Registrar en auditoría de la base de datos
    try {
      await recordSimulation({
        cuil: result.customer.cuil,
        clientName: result.customer.full_name,
        operatorEmail,
        diasPromesa: result.dias_promesa,
        totalCuotas: result.summary.total_cuotas,
        montoTotal: result.summary.monto_total,
        montoActualizado: result.summary.monto_actualizado,
        reintegro: result.summary.reintegro,
        montoFinal: result.summary.monto_final,
      });
    } catch (auditErr) {
      console.error('Error registrando auditoría en DB:', auditErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en /api/simulate:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar la simulación.' },
      { status: 500 }
    );
  }
}
