/**
 * Public base URL for the app.
 *
 * Resolution order:
 *   1. Explicit NEXT_PUBLIC_SITE_URL env var (recommended).
 *   2. x-forwarded-* headers (proxied deploys).
 *   3. Hardcoded production URL (Vercel) so auth works even without the env var.
 *   4. Browser origin (client) / localhost (dev).
 */
const PRODUCTION_URL = 'https://tempo-trades-two.vercel.app';

export function getSiteUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  if (request) {
    const fwdHost = request.headers.get('x-forwarded-host');
    const fwdProto = request.headers.get('x-forwarded-proto') ?? 'https';
    if (fwdHost) return `${fwdProto}://${fwdHost}`;
  }

  if (process.env.NODE_ENV === 'production') return PRODUCTION_URL;

  if (typeof window !== 'undefined') return window.location.origin;

  return 'http://localhost:3000';
}
