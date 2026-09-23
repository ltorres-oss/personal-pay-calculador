import { NextResponse } from 'next/server';
import { getBaseMetadata, getRecentSimulations } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const metadata = await getBaseMetadata();
    const recentSimulations = await getRecentSimulations(8);
    return NextResponse.json(
      { metadata, recentSimulations },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
