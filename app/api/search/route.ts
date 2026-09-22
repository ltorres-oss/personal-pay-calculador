import { NextRequest, NextResponse } from 'next/server';
import { searchClientSuggestions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchClientSuggestions(q);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error en /api/search:', error);
    return NextResponse.json({ error: error.message, results: [] }, { status: 500 });
  }
}
