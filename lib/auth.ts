import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'sobre_tudo_secret_key_2026_safe_token_x99';
const SALT = 'sobre_tudo_salt_2026_';

export interface UserSession {
  id: string;
  username: string;
  exp: number;
}

/**
 * Hash a plain text password using Web Crypto SHA-256 with static salt
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare plain text password against hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}

/**
 * Helper to encode Base64URL
 */
function base64UrlEncode(str: string): string {
  const base64 = typeof btoa !== 'undefined'
    ? btoa(str)
    : Buffer.from(str).toString('base64');
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Helper to decode Base64URL
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return typeof atob !== 'undefined'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Import secret key for Web Crypto HMAC-SHA256
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Create a signed JWT token valid for specified hours
 */
export async function createJwt(payload: Omit<UserSession, 'exp'>, hoursValid: number = 12): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + hoursValid * 3600;
  const fullPayload: UserSession = { ...payload, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataToSign));
  
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureString = String.fromCharCode(...signatureArray);
  const encodedSignature = base64UrlEncode(signatureString);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify and decode JWT token
 */
export async function verifyJwt(token: string): Promise<UserSession | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    const key = await getCryptoKey();

    // Reconstruct signature binary
    const sigString = base64UrlDecode(encodedSignature);
    const sigUint8 = new Uint8Array(sigString.length);
    for (let i = 0; i < sigString.length; i++) {
      sigUint8[i] = sigString.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigUint8,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    const payloadStr = base64UrlDecode(encodedPayload);
    const payload: UserSession = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current session from server cookie
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return await verifyJwt(token);
}
