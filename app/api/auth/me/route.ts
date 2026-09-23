import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('ppay_session')?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = verifySession(token);
  return NextResponse.json({ user: user || null }, { status: 200 });
}
