import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log request details to Vercel logs
  console.log(`[MIDDLEWARE_LOG] Request path: ${pathname}`);
  console.log(`[MIDDLEWARE_LOG] Method: ${request.method}`);
  console.log(`[MIDDLEWARE_LOG] Referer: ${request.headers.get('referer') || 'none'}`);
  console.log(`[MIDDLEWARE_LOG] User-Agent: ${request.headers.get('user-agent') || 'none'}`);

  return NextResponse.next();
}

// Ensure it runs for all paths
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
