/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { createHmac } from 'crypto';

const STEAM_CHARS = '23456789BCDFGHJKMNPQRTVWXY';
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const ALGORITHMS: Record<string, string> = { SHA1: 'sha1', SHA256: 'sha256', SHA512: 'sha512' };

type Totp = { key: Buffer; algorithm: string; digits: number; period: number };

/** RFC 4648 base32; spaces, dashes, padding and lower case are accepted. */
function fromBase32(str: string): Buffer {
  const clean = str.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
  if (!clean) throw new Error('Invalid secret: it is empty.');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const index = BASE32_CHARS.indexOf(char);
    if (index < 0) throw new Error(`Invalid secret: "${char}" is not a base32 character.`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

/** Reads an otpauth://totp/... URI (Google Authenticator key URI format). */
function parseUri(uri: string): Totp {
  const url = new URL(uri);
  if (url.host.toLowerCase() !== 'totp') throw new Error('Only TOTP (time-based) otpauth:// URIs are supported.');
  const params = url.searchParams;
  const secret = params.get('secret');
  if (!secret) throw new Error('The otpauth:// URI has no secret.');
  const algorithm = ALGORITHMS[(params.get('algorithm') ?? 'SHA1').toUpperCase().replace('-', '')];
  if (!algorithm) throw new Error(`Unsupported algorithm ${params.get('algorithm')} (use SHA1, SHA256 or SHA512).`);
  const digits = Number(params.get('digits') ?? 6);
  if (!Number.isInteger(digits) || digits < 1 || digits > 10) throw new Error(`Invalid digits ${params.get('digits')} in otpauth:// URI.`);
  const period = Number(params.get('period') ?? 30);
  if (!Number.isInteger(period) || period < 1) throw new Error(`Invalid period ${params.get('period')} in otpauth:// URI.`);
  return { key: fromBase32(secret), algorithm, digits, period };
}

function totpOf(secret: string): Totp {
  const s = secret.trim();
  return /^otpauth:\/\//i.test(s) ? parseUri(s) : { key: fromBase32(s), algorithm: 'sha1', digits: 6, period: 30 };
}

/** RFC 4226 dynamic truncation of the HMAC of the time step counter. */
function truncatedHmac(key: Buffer, algorithm: string, counter: number): number {
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  message.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac(algorithm, key).update(message).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  return hmac.readUInt32BE(offset) & 0x7fffffff;
}

/**
 * Decodes a Steam Guard secret in any of the formats tools export it in:
 * - base64 `shared_secret` (as in a .maFile)
 * - 40-char hex
 * - base32, `steam://BASE32` or an otpauth:// URI
 */
export function steamSecret(secret: string): Buffer {
  const s = secret.trim();
  let key: Buffer;
  if (/^otpauth:\/\//i.test(s)) key = parseUri(s).key;
  else if (/^steam:\/\//i.test(s)) key = fromBase32(s.slice('steam://'.length));
  else if (/^[0-9a-f]{40}$/i.test(s)) key = Buffer.from(s, 'hex');
  else if (/^[A-Z2-7]{32}=*$/i.test(s.replace(/[\s-]/g, ''))) key = fromBase32(s.replace(/=+$/, ''));
  else if (/^[A-Za-z0-9+/]+={0,2}$/.test(s)) key = Buffer.from(s, 'base64');
  else throw new Error('Invalid Steam secret: expected a base64 shared_secret, base32 secret or otpauth:// URI.');
  if (key.length < 10) throw new Error('Invalid Steam secret: decoded key is too short.');
  return key;
}

export function steamCode(secret: string, timestamp: number): string {
  let fullCode = truncatedHmac(steamSecret(secret), 'sha1', Math.floor(timestamp / 1000 / 30));
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += STEAM_CHARS[fullCode % STEAM_CHARS.length];
    fullCode = Math.floor(fullCode / STEAM_CHARS.length);
  }
  return code;
}

export function totpCode(secret: string, timestamp: number): string {
  const { key, algorithm, digits, period } = totpOf(secret);
  const code = truncatedHmac(key, algorithm, Math.floor(timestamp / 1000 / period)) % 10 ** digits;
  return String(code).padStart(digits, '0');
}

/** Seconds each code is valid for (Steam Guard and plain secrets use 30). */
export function codePeriod(secret: string, steam: boolean): number {
  return steam ? 30 : totpOf(secret).period;
}
