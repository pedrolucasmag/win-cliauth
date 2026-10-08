/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { createHmac } from 'crypto';
import { Secret, TOTP, URI } from 'otpauth';

const STEAM_CHARS = '23456789BCDFGHJKMNPQRTVWXY';

function parseUri(uri: string): TOTP {
  const otp = URI.parse(uri);
  if (!(otp instanceof TOTP)) throw new Error('Only TOTP (time-based) otpauth:// URIs are supported.');
  return otp;
}

function fromBase32(str: string): Buffer {
  return Buffer.from(Secret.fromBase32(str.replace(/[\s-]/g, '').toUpperCase()).bytes);
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
  if (/^otpauth:\/\//i.test(s)) key = Buffer.from(parseUri(s).secret.bytes);
  else if (/^steam:\/\//i.test(s)) key = fromBase32(s.slice('steam://'.length));
  else if (/^[0-9a-f]{40}$/i.test(s)) key = Buffer.from(s, 'hex');
  else if (/^[A-Z2-7]{32}=*$/i.test(s.replace(/[\s-]/g, ''))) key = fromBase32(s.replace(/=+$/, ''));
  else if (/^[A-Za-z0-9+/]+={0,2}$/.test(s)) key = Buffer.from(s, 'base64');
  else throw new Error('Invalid Steam secret: expected a base64 shared_secret, base32 secret or otpauth:// URI.');
  if (key.length < 10) throw new Error('Invalid Steam secret: decoded key is too short.');
  return key;
}

export function steamCode(secret: string, timestamp: number): string {
  const counter = Buffer.alloc(8);
  counter.writeUInt32BE(Math.floor(timestamp / 1000 / 30), 4);
  const hmac = createHmac('sha1', steamSecret(secret)).update(counter).digest();
  const offset = hmac[19] & 0x0f;
  let fullCode = hmac.readUInt32BE(offset) & 0x7fffffff;
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += STEAM_CHARS[fullCode % STEAM_CHARS.length];
    fullCode = Math.floor(fullCode / STEAM_CHARS.length);
  }
  return code;
}

export function totpCode(secret: string, timestamp: number): string {
  const s = secret.trim();
  const totp = /^otpauth:\/\//i.test(s)
    ? parseUri(s)
    : new TOTP({ secret: Secret.fromBase32(s.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase()), digits: 6, period: 30 });
  return totp.generate({ timestamp });
}

/** Seconds each code is valid for (Steam Guard and plain secrets use 30). */
export function codePeriod(secret: string, steam: boolean): number {
  const s = secret.trim();
  return !steam && /^otpauth:\/\//i.test(s) ? parseUri(s).period : 30;
}
