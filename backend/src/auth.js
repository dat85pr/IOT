import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAuth({ username, password, tokenSecret }) {
  if (!username || !password || !tokenSecret) {
    throw new Error('AUTH_USERNAME, AUTH_PASSWORD and AUTH_TOKEN_SECRET must be configured');
  }

  const authenticate = (requestUsername, requestPassword) => (
    requestUsername === username && requestPassword === password
  );

  const createToken = () => {
    const payload = base64Url(JSON.stringify({
      sub: username,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    }));
    return `${payload}.${sign(payload, tokenSecret)}`;
  };

  const verifyToken = token => {
    const [payload, signature] = typeof token === 'string' ? token.split('.') : [];
    if (!payload || !signature) return false;

    const expectedSignature = sign(payload, tokenSecret);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;

    try {
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      return claims.sub === username && Number.isInteger(claims.exp) && claims.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  };

  const requireAuth = (request, response, next) => {
    const authorization = request.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(\S+)$/i);
    if (!match || !verifyToken(match[1])) {
      return response.status(401).json({ error: 'Authorization bearer token is required or invalid' });
    }
    next();
  };

  return { authenticate, createToken, requireAuth };
}
