import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizedUsers, addAuthorizedUser, toggleUserStatus, deleteAuthorizedUser, updateUserPassword } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const users = await getAuthorizedUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, password, invited_by } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    await addAuthorizedUser(
      email,
      name || email.split('@')[0],
      role || 'operador',
      password || undefined,
      invited_by || 'admin'
    );
    const updatedUsers = await getAuthorizedUsers();
    return NextResponse.json({ success: true, users: updatedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, password } = body;

    if (!id || !password || password.trim().length === 0) {
      return NextResponse.json({ error: 'ID y contraseña requeridos.' }, { status: 400 });
    }

    await updateUserPassword(id, password.trim());
    const updatedUsers = await getAuthorizedUsers();
    return NextResponse.json({ success: true, users: updatedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido.' }, { status: 400 });
    }

    await toggleUserStatus(id);
    const updatedUsers = await getAuthorizedUsers();
    return NextResponse.json({ success: true, users: updatedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0', 10);

    if (!id) {
      return NextResponse.json({ error: 'ID requerido.' }, { status: 400 });
    }

    await deleteAuthorizedUser(id);
    const updatedUsers = await getAuthorizedUsers();
    return NextResponse.json({ success: true, users: updatedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
