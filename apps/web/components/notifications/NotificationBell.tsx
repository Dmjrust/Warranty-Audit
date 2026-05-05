'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const API: string = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TYPE_ICON: Record<string, string> = {
  SLA_YELLOW: '⚠️',
  SLA_ORANGE: '🔶',
  SLA_RED:    '🔴',
};

const TYPE_COLOR: Record<string, string> = {
  SLA_YELLOW: 'border-yellow-800/50 bg-yellow-950/20',
  SLA_ORANGE: 'border-orange-800/50 bg-orange-950/20',
  SLA_RED:    'border-red-800/50 bg-red-950/20',
};

interface Notification {
  id: string;
  type: string;
  message: string;
  processId: string | null;
  read: boolean;
  createdAt: string;
}

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}/api${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  });
  if (!res.ok) return null;
  return res.json();
}

export function NotificationBell() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken as string | undefined;

  const [unread, setUnread] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchUnread() {
    if (!token) return;
    const data = await apiFetch('/notifications?unread=true', token);
    if (data) setUnread(data);
  }

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markRead(id: string) {
    if (!token) return;
    await apiFetch(`/notifications/${id}/read`, token, { method: 'PATCH' });
    setUnread((prev) => prev.filter((n) => n.id !== id));
  }

  async function markAllRead() {
    if (!token) return;
    await apiFetch('/notifications/read-all', token, { method: 'PATCH' });
    setUnread([]);
  }

  const count = unread.length;

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors"
        title="Notificações"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold text-white">Notificações</span>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {unread.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-600 text-sm">
                Nenhuma notificação pendente
              </div>
            ) : (
              <ul className="divide-y divide-gray-800/50">
                {unread.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 border-l-2 ${TYPE_COLOR[n.type] ?? 'border-gray-700 bg-transparent'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="mt-0.5 flex-shrink-0">{TYPE_ICON[n.type] ?? '🔔'}</span>
                        <div>
                          <p className="text-xs text-gray-300 leading-snug">{n.message}</p>
                          {n.processId && (
                            <a
                              href={`/processes/${n.processId}`}
                              className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 inline-block"
                              onClick={() => setOpen(false)}
                            >
                              Abrir processo →
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-gray-600 hover:text-gray-400 flex-shrink-0 text-lg leading-none"
                        title="Marcar como lida"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
