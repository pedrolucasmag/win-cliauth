/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';

type Source = 'totp' | 'steam';
type Cache = Partial<Record<Source, { offset: number; checkedAt: number }>>;

const CACHE_PATH = join(process.env.APPDATA ?? homedir(), 'win-cliauth', 'time.json');
const MAX_AGE = 6 * 60 * 60 * 1000;
const TIMEOUT = 5000;

async function readCache(): Promise<Cache> {
  try {
    return JSON.parse(await readFile(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function writeCache(cache: Cache) {
  try {
    await mkdir(dirname(CACHE_PATH), { recursive: true });
    await writeFile(CACHE_PATH, JSON.stringify(cache));
  } catch {
    // the cache is an optimisation only
  }
}

// Returns server time minus local time, in ms, measured at the request midpoint.
async function fetchOffset(source: Source): Promise<number> {
  const start = Date.now();
  let serverTime: number;
  if (source === 'steam') {
    const response = await fetch('https://api.steampowered.com/ITwoFactorService/QueryTime/v1/', {
      method: 'POST',
      body: '',
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const json = (await response.json()) as { response?: { server_time?: string } };
    serverTime = Number(json?.response?.server_time) * 1000;
  } else {
    const response = await fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT) });
    serverTime = Date.parse(response.headers.get('date') ?? '');
  }
  if (!Number.isFinite(serverTime)) throw new Error('Invalid server time');
  return serverTime - (start + Date.now()) / 2;
}

/**
 * Current time corrected by the offset to a trusted HTTPS time source.
 * The offset is cached for a few hours; `force` re-syncs. On network failure
 * the last known offset (or the local clock) is used.
 */
export async function syncedNow(source: Source, force = false): Promise<number> {
  const cache = await readCache();
  const cached = cache[source];
  if (!force && cached && Date.now() - cached.checkedAt < MAX_AGE) return Date.now() + cached.offset;
  try {
    const offset = await fetchOffset(source);
    cache[source] = { offset, checkedAt: Date.now() };
    await writeCache(cache);
    return Date.now() + offset;
  } catch {
    return Date.now() + (cached?.offset ?? 0);
  }
}
