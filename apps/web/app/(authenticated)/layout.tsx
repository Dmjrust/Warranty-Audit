import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex h-screen">
        {/* Sidebar placeholder — will be replaced with full sidebar from prototype */}
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h1 className="font-bold text-white">Warranty Audit AI</h1>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{session.user?.email}</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/processes', label: 'Processos' },
              { href: '/history', label: 'Histórico' },
              { href: '/settings', label: 'Configurações' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
