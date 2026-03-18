import Link from 'next/link';

const sections = [
  { href: '/admin/rooms', icon: '🚪', title: 'Manage Rooms', desc: 'Add, edit or deactivate examination rooms' },
  { href: '/admin/tests', icon: '🧪', title: 'Manage Tests', desc: 'Add and configure diagnostic tests' },
  { href: '/admin/mappings', icon: '🔗', title: 'Test → Room Mapping', desc: 'Assign tests to their respective rooms' },
  { href: '/admin/settings', icon: '⚙️', title: 'Center Settings', desc: 'Queue rules, timing and behavior settings' },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">← Home</Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-900 text-lg">⚙️ Admin Panel</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{s.title}</div>
              <div className="text-sm text-gray-500 mt-1">{s.desc}</div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
