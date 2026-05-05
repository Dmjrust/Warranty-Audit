import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',      icon: '◻' },
  { href: '/processes',  label: 'Processos',       icon: '◻' },
  { href: '/history',    label: 'Histórico',       icon: '◻' },
  { href: '/settings',   label: 'Configurações',   icon: '◻' },
];

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const user = session.user as any;
  const role: string = user.role ?? '';

  const ROLE_LABEL: Record<string, string> = {
    tecnico:           'Técnico',
    gestor_garantia:   'Gestor de Garantia',
    auditor:           'Auditor',
    admin_tenant:      'Administrador',
    admin_plataforma:  'Admin Plataforma',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
          {/* Brand + user */}
          <div className="p-4 border-b border-gray-800">
            <h1 className="font-bold text-white text-sm">Warranty Audit AI</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{session.user?.email}</p>
            {role && (
              <span className="mt-1.5 inline-block text-[10px] bg-gray-800 text-gray-400 rounded px-1.5 py-0.5">
                {ROLE_LABEL[role] ?? role}
              </span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Novo processo CTA */}
          <div className="p-3 border-t border-gray-800">
            <Link
              href="/processes/new"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              + Novo Processo
            </Link>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-end px-4 gap-2 flex-shrink-0">
            <NotificationBell />
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
