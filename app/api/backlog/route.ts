import { NextRequest, NextResponse } from 'next/server';
import { getQueryBacklog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const backlog = await getQueryBacklog(limit);
    return NextResponse.json({ backlog });
  } catch (error: any) {
    console.error('Error en /api/backlog:', error);
    return NextResponse.json({ error: error.message || 'Error obteniendo backlog.' }, { status: 500 });
  }
}
