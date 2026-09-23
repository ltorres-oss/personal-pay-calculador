import crypto from 'crypto';
import { getSupabaseClient } from './supabase';

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'ppay-secret-key-production-32-chars-min!';

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'operador';
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function signSession(user: SessionUser): string {
  const payload = JSON.stringify({
    ...user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const base64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(base64).digest('base64url');
  return `${base64}.${signature}`;
}

export function verifySession(token: string): SessionUser | null {
  if (!token || !token.includes('.')) return null;
  const [base64, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(base64).digest('base64url');
  if (signature !== expected) return null;

  try {
    const data = JSON.parse(Buffer.from(base64, 'base64url').toString('utf-8'));
    if (data.exp && Date.now() > data.exp) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export async function authenticateUser(email: string, password?: string): Promise<SessionUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !user) return null;

    if (password) {
      const hashed = hashPassword(password);
      if (user.password_hash && user.password_hash !== hashed) {
        return null;
      }
      if (!user.password_hash) {
        await supabase.from('users').update({ password_hash: hashed }).eq('id', user.id);
      }
    }

    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      role: user.role,
    };
  }

  if (cleanEmail === 'admin@personalpay.com.ar') {
    return { id: 1, email: cleanEmail, name: 'Administrador Principal', role: 'admin' };
  }
  if (cleanEmail === 'operador@personalpay.com.ar') {
    return { id: 2, email: cleanEmail, name: 'Operador Demo', role: 'operador' };
  }

  return null;
}
