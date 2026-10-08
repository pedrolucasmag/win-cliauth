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

type Otp = { type: 'totp' | 'hotp'; key: Buffer; algorithm: string; digits: number; period: number; counter: number };

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

/** Reads an otpauth://totp/... or otpauth://hotp/... URI (Google Authenticator key URI format). */
function parseUri(uri: string): Otp {
  const url = new URL(uri);
  const type = url.host.toLowerCase();
  if (type !== 'totp' && type !== 'hotp') throw new Error('Unsupported otpauth:// URI: expected otpauth://totp/ or otpauth://hotp/.');
  const params = url.searchParams;
  const secret = params.get('secret');
  if (!secret) throw new Error('The otpauth:// URI has no secret.');
  const algorithm = ALGORITHMS[(params.get('algorithm') ?? 'SHA1').toUpperCase().replace('-', '')];
  if (!algorithm) throw new Error(`Unsupported algorithm ${params.get('algorithm')} (use SHA1, SHA256 or SHA512).`);
  const digits = Number(params.get('digits') ?? 6);
  if (!Number.isInteger(digits) || digits < 1 || digits > 10) throw new Error(`Invalid digits ${params.get('digits')} in otpauth:// URI.`);
  const period = Number(params.get('period') ?? 30);
  if (!Number.isInteger(period) || period < 1) throw new Error(`Invalid period ${params.get('period')} in otpauth:// URI.`);
  const counter = Number(params.get('counter') ?? 0);
  if (!Number.isSafeInteger(counter) || counter < 0) throw new Error(`Invalid counter ${params.get('counter')} in otpauth:// URI.`);
  return { type, key: fromBase32(secret), algorithm, digits, period, counter };
}

function otpOf(secret: string): Otp {
  const s = secret.trim();
  return /^otpauth:\/\//i.test(s)
    ? parseUri(s)
    : { type: 'totp', key: fromBase32(s), algorithm: 'sha1', digits: 6, period: 30, counter: 0 };
}

function totpOf(secret: string): Otp {
  const otp = otpOf(secret);
  if (otp.type === 'hotp') throw new Error('This is a counter-based (HOTP) secret; it has no time-based code.');
  return otp;
}

/** True for otpauth://hotp/ URIs. */
export function isHotpUri(secret: string): boolean {
  return /^otpauth:\/\/hotp\//i.test(secret.trim());
}

/** The counter an otpauth://hotp/ URI starts at (0 for anything else). */
export function initialCounter(secret: string): number {
  return otpOf(secret).counter;
}

/** RFC 4226 dynamic truncation of the HMAC of a counter (the time step for TOTP). */
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

function formatCode(value: number, digits: number): string {
  return String(value % 10 ** digits).padStart(digits, '0');
}

export function totpCode(secret: string, timestamp: number): string {
  const { key, algorithm, digits, period } = totpOf(secret);
  return formatCode(truncatedHmac(key, algorithm, Math.floor(timestamp / 1000 / period)), digits);
}

/** RFC 4226 counter-based code; secret is an otpauth://hotp/ URI or a plain base32 secret. */
export function hotpCode(secret: string, counter: number): string {
  const { key, algorithm, digits } = otpOf(secret);
  return formatCode(truncatedHmac(key, algorithm, counter), digits);
}

/** Seconds each code is valid for (Steam Guard and plain secrets use 30). */
export function codePeriod(secret: string, steam: boolean): number {
  return steam ? 30 : totpOf(secret).period;
}
