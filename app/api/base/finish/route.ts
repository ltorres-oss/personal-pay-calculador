import { NextRequest, NextResponse } from 'next/server';
import { finishDailyBaseUpload } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadataId } = body;

    if (!metadataId) {
      return NextResponse.json({ error: 'metadataId requerido.' }, { status: 400 });
    }

    const result = await finishDailyBaseUpload(metadataId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error en /api/base/finish:', error);
    return NextResponse.json({ error: error.message || 'Error finalizando base.' }, { status: 500 });
  }
}
