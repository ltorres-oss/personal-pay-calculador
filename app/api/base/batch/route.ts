import { NextRequest, NextResponse } from 'next/server';
import { insertDailyBaseBatch } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Se esperaba un array de registros.' }, { status: 400 });
    }

    const result = await insertDailyBaseBatch(records);
    return NextResponse.json({ success: true, inserted: result.inserted });
  } catch (error: any) {
    console.error('Error en /api/base/batch:', error);
    return NextResponse.json({ error: error.message || 'Error insertando lote.' }, { status: 500 });
  }
}
