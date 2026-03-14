import Link from 'next/link';

export default function NotFound() {
  // This will log in Vercel's server logs when the 404 page is rendered
  if (typeof window === 'undefined') {
    console.error(`[404_NOT_FOUND] A user hit the 404 page on the server.`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-md bg-white p-12 rounded-2xl shadow-xl">
        <h1 className="text-9xl font-black text-blue-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Oups ! Page égarée.</h2>
        <p className="text-gray-500 text-lg">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
      
      {/* Client-side script to log the current URL in the browser console for the user */}
      <script
        dangerouslySetInnerHTML={{
          __html: `console.warn("[404_CLIENT_LOG] Path not found: " + window.location.pathname);`,
        }}
      />
    </div>
  );
}
