import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, signSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ error: 'Debe ingresar un email.' }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas o usuario no autorizado.' },
        { status: 401 }
      );
    }

    const token = signSession(user);
    const response = NextResponse.json({ success: true, user });

    response.cookies.set({
      name: 'ppay_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno de autenticación' }, { status: 500 });
  }
}
