export default function Home() {
  if (typeof window === 'undefined') {
    console.log('[ROOT_PAGE_LOG] Rendering Home page on server');
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Cabinet Dentaire</h1>
        <p className="text-slate-600">Initialisation de l&apos;application...</p>
        <a href="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Accéder au Dashboard
        </a>
      </div>
    </div>
  );
}
