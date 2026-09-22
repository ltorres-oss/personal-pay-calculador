import { NextResponse } from 'next/server';
import { getBaseMetadata, getRecentSimulations } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metadata = await getBaseMetadata();
    const recentSimulations = await getRecentSimulations(8);
    return NextResponse.json({ metadata, recentSimulations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
