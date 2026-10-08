/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { readFileSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { dirname, join } from 'path';

const CACHE_PATH = join(process.env.APPDATA ?? homedir(), 'win-cliauth', 'update.json');
const CHECK_EVERY = 24 * 60 * 60 * 1000;
const TIMEOUT = 1500;

export function currentVersion(): string {
  return JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')).version;
}

/** True when version a is newer than b (x.y.z, pre-release tags ignored). */
export function isNewer(a: string, b: string): boolean {
  const parse = (v: string) => v.split('-')[0].split('.').map(Number);
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  return false;
}

/**
 * Prints a one-line notice on stderr when a newer version is on npm. The
 * registry is asked at most once a day, with a short timeout; failures are
 * ignored. Disabled for scripts (stderr not a terminal), in CI, and with
 * WIN_CLIAUTH_NO_UPDATE_CHECK=1.
 */
export async function notifyUpdate(): Promise<void> {
  if (!process.stderr.isTTY || process.env.CI || process.env.WIN_CLIAUTH_NO_UPDATE_CHECK) return;
  try {
    let cache: { checkedAt?: number; latest?: string } = {};
    try {
      cache = JSON.parse(await readFile(CACHE_PATH, 'utf8'));
    } catch {
      // first run or unreadable cache
    }
    if (!cache.checkedAt || Date.now() - cache.checkedAt > CHECK_EVERY) {
      const response = await fetch('https://registry.npmjs.org/win-cliauth/latest', { signal: AbortSignal.timeout(TIMEOUT) });
      const { version } = (await response.json()) as { version?: string };
      cache = { checkedAt: Date.now(), latest: version };
      await mkdir(dirname(CACHE_PATH), { recursive: true });
      await writeFile(CACHE_PATH, JSON.stringify(cache));
    }
    const current = currentVersion();
    if (cache.latest && isNewer(cache.latest, current))
      console.error(`\nUpdate available: ${current} → ${cache.latest}. Run: npm install -g win-cliauth`);
  } catch {
    // never let the update check break a command
  }
}
