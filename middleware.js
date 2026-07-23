/* Edge Middleware — gates the whole static site behind HTTP Basic Auth.
   Works on Vercel's free Hobby plan (Edge Middleware isn't a Pro feature).
   Credentials come from env vars, not hardcoded here, so they can be
   rotated from the Vercel dashboard without touching code. */
export const config = {
  matcher: '/:path*',
};

function unauthorized() {
  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Mosaic demo", charset="UTF-8"' },
  });
}

export default function middleware(request) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;
  if (!user || !pass) return unauthorized(); // fail closed if not configured

  const authHeader = request.headers.get('authorization') || '';
  const [scheme, encoded] = authHeader.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(':');
  const suppliedUser = decoded.slice(0, sep);
  const suppliedPass = decoded.slice(sep + 1);
  if (suppliedUser !== user || suppliedPass !== pass) return unauthorized();

  // credentials check out — let the request continue to the static file.
}
