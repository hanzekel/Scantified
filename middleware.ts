import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Decode base64 credentials
    const [user, pwd] = atob(authValue).split(':');

    // IMPORTANT: Change these credentials to your preferred admin login!
    if (user === 'admin' && pwd === 'ministry2026') {
      return NextResponse.next();
    }
  }

  // If unauthorized, prompt the browser's native login box
  return new NextResponse('Authentication required to access the Ministry Portal.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Scantified Portal"',
    },
  });
}

// Strictly define which routes require the admin password.
// The home page '/' and '/scanner' remain unprotected so volunteers can still scan QRs.
export const config = {
  matcher: [
    '/members/:path*',
    '/sessions/:path*',
    '/reports/:path*',
    '/records/:path*',
  ],
};