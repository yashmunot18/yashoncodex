import Link from 'next/link';

export default function HomePage() {
  const views = [
    {
      href: '/floor',
      icon: '🏢',
      title: 'Floor Manager',
      desc: 'Overview of all rooms, queues, and patient flow',
      color: 'border-blue-200 hover:border-blue-400',
    },
    {
      href: '/room',
      icon: '🩺',
      title: 'Room Technician',
      desc: 'Manage your room queue – Call, Start, Complete',
      color: 'border-green-200 hover:border-green-400',
    },
    {
      href: '/patient',
      icon: '📱',
      title: 'Patient Status',
      desc: 'Check test progress and queue position',
      color: 'border-purple-200 hover:border-purple-400',
    },
    {
      href: '/tv',
      icon: '📺',
      title: 'TV Display',
      desc: 'Waiting area board – Now Serving & Up Next',
      color: 'border-orange-200 hover:border-orange-400',
    },
    {
      href: '/admin',
      icon: '⚙️',
      title: 'Admin Panel',
      desc: 'Configure rooms, tests, mappings and settings',
      color: 'border-red-200 hover:border-red-400',
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
            NDC
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">NDC DIAGNOSTIC CENTRE</h1>
            <p className="text-sm text-gray-500">Queue Management System · THANE</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
        <p className="text-gray-500 mb-10">Select your role to get started</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {views.map((v) => (
            <Link
              key={v.href}
              href={v.href}
              className={`block bg-white border-2 ${v.color} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group`}
            >
              <div className="text-4xl mb-3">{v.icon}</div>
              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                {v.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{v.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pb-8">
        NDC Diagnostic Centre · THANE · Queue Management System v1.0
      </footer>
    </main>
  );
}
