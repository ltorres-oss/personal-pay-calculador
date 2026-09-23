'use client';

import React, { useEffect, useState } from 'react';
import { AuthorizedUser } from '@/lib/types';
import { Users, UserPlus, Shield, Check, X, Trash2, Mail, Key, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'operador' | 'admin'>('operador');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal para cambiar contraseña
  const [selectedUser, setSelectedUser] = useState<AuthorizedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState<string | null>(null);

  const fetchUsers = () => {
    fetch('/api/users?t=' + Date.now(), { cache: 'no-store' })
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
    if (!email || !email.includes('@')) {
      setMsg({ text: 'Por favor ingrese un correo válido.', type: 'error' });
      return;
    }
    if (!password || password.trim().length < 4) {
      setMsg({ text: 'Por favor ingrese una contraseña de al menos 4 caracteres.', type: 'error' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar usuario.');
      setUsers(data.users);
      setEmail('');
      setName('');
      setPassword('');
      setMsg({ text: `Usuario ${email} registrado exitosamente con su contraseña.`, type: 'success' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ text: err.message, type: 'error' });
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

  const handleDelete = async (id: number, emailToDelete: string) => {
    if (!confirm(`¿Seguro que desea eliminar al usuario ${emailToDelete}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.users) setUsers(data.users);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword || newPassword.trim().length < 4) {
      setModalMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setModalLoading(true);
    setModalMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, password: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar contraseña.');
      setUsers(data.users);
      setSelectedUser(null);
      setNewPassword('');
      setMsg({ text: `Contraseña de ${selectedUser.email} actualizada exitosamente.`, type: 'success' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setModalMsg(err.message || 'Error al guardar contraseña.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gestión y Administración de Usuarios
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Crea las cuentas de acceso al sistema, define sus contraseñas iniciales y asigna roles (<strong>Administrador</strong> u <strong>Operador</strong>).
        </p>
      </div>

      {/* Formulario Registrar Usuario */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <span>Registrar Nuevo Usuario y Contraseña</span>
        </h3>

        <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="usuario@wecrossbpo.com.ar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej: Valeria Torres"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Contraseña Inicial</label>
            <input
              type="text"
              placeholder="Mínimo 4 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Rol de Acceso</label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium"
            >
              <option value="operador">Operador (Solo Simulación)</option>
              <option value="admin">Administrador (Control Total)</option>
            </select>
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
            {msg && (
              <span className={`text-xs font-semibold ${msg.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {msg.text}
              </span>
            )}
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{loading ? 'Guardando...' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Usuarios Registrados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Usuarios Registrados ({users.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Puedes cambiar o asignar la contraseña de cualquier usuario en cualquier momento.
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                  {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 font-bold">{u.email}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {u.role === 'admin' ? '👑 Administrador' : '👤 Operador'}
                    </span>

                    {/* Badge de Contraseña */}
                    {u.has_password ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Key className="w-2.5 h-2.5" />
                        <span>Contraseña activa</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Sin contraseña definida</span>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    {u.name} &bull; Registrado: {u.invited_at ? new Date(u.invited_at).toLocaleDateString('es-AR') : 'Inicial'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Botón Cambiar Contraseña */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setNewPassword('');
                    setModalMsg(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors border border-slate-200"
                  title="Cambiar contraseña de este usuario"
                >
                  <Key className="w-3 h-3 text-slate-500" />
                  <span>{u.has_password ? 'Cambiar Contraseña' : 'Asignar Contraseña'}</span>
                </button>

                {/* Botón Habilitar/Deshabilitar */}
                <button
                  type="button"
                  onClick={() => handleToggle(u.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                    u.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {u.is_active ? 'Habilitado' : 'Inhabilitado'}
                </button>

                {/* Botón Eliminar */}
                <button
                  type="button"
                  onClick={() => handleDelete(u.id, u.email)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Eliminar usuario"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para Modificar / Asignar Contraseña */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedUser.has_password ? 'Cambiar Contraseña' : 'Asignar Contraseña'}
                </h3>
                <p className="text-xs text-slate-500">
                  Usuario: <strong>{selectedUser.email}</strong> ({selectedUser.name})
                </p>
              </div>
            </div>

            {modalMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Escriba la nueva contraseña..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  El usuario utilizará esta clave para ingresar en la pantalla de inicio de sesión.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  disabled={modalLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalLoading ? 'Guardando...' : 'Establecer Contraseña'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

