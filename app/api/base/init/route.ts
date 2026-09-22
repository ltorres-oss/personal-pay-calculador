import { NextRequest, NextResponse } from 'next/server';
import { initDailyBaseUpload } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, totalRows } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Nombre de archivo requerido.' }, { status: 400 });
    }

    const result = await initDailyBaseUpload(filename, totalRows || 0);
    return NextResponse.json({ success: true, metadataId: result.metadataId });
  } catch (error: any) {
    console.error('Error en /api/base/init:', error);
    return NextResponse.json({ error: error.message || 'Error inicializando base.' }, { status: 500 });
  }
}
