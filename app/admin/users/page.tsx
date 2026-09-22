'use client';

import React, { useEffect, useState } from 'react';
import { AuthorizedUser } from '@/lib/types';
import { Users, UserPlus, Shield, Check, X, Trash2, Mail } from 'lucide-react';

export default function UsersWhitelistPage() {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'operador' | 'admin'>('operador');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchUsers = () => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar usuario.');
      setUsers(data.users);
      setEmail('');
      setName('');
      setMsg('Usuario invitado exitosamente a la whitelist.');
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.users) setUsers(data.users);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea remover este usuario de la lista de invitaciones?')) return;
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.users) setUsers(data.users);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Usuarios Habilitados (Whitelist Google)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Solo las cuentas de correo registradas en esta lista tendrán acceso autorizado al sistema mediante Google OAuth.
        </p>
      </div>

      {/* Add User Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>Invitar Nuevo Correo de Google</span>
        </h3>

        <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="email"
            placeholder="correo@personalpay.com.ar o gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="sm:col-span-2 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
          <input
            type="text"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
          <select
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
          >
            <option value="operador">Rol: Operador</option>
            <option value="admin">Rol: Administrador</option>
          </select>

          <div className="sm:col-span-4 flex items-center justify-between mt-2">
            {msg && <span className="text-xs font-semibold text-blue-600">{msg}</span>}
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Guardando...' : 'Habilitar Correo'}
            </button>
          </div>
        </form>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Correos Autorizados ({users.length})
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                  {u.name ? u.name.charAt(0) : u.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-bold">{u.email}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {u.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {u.name} &bull; Invitado el: {u.invited_at}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(u.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    u.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {u.is_active ? 'Habilitado' : 'Inhabilitado'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(u.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Eliminar de la lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
