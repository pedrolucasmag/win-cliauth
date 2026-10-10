/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import { decryptBackup, encryptBackup } from './backup';
import { findName } from './names';
import { codePeriod, hotpCode, initialCounter, isHotpUri, steamCode, steamSecret, totpCode } from './otp';
import { readSecret } from './prompt';
import { decrypt, encrypt, Entry, powershellEnv } from './pshell';
import { syncedNow } from './time';

function parseEntry(entry: Entry): { secret: string; steam: boolean; counter?: number } {
  return typeof entry === 'string'
    ? { secret: entry, steam: false }
    : { secret: entry.secret, steam: !!entry.steam, counter: entry.counter };
}

function notFound(name: string) {
  console.error(`${name} not found.`);
  process.exitCode = 1;
}

function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const clip = spawn('clip');
    clip.on('error', reject);
    clip.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`clip exited with code ${code}`))));
    clip.stdin.end(text);
  });
}

// Clears the clipboard after a delay, in a detached process so the command returns
// right away; it leaves the clipboard alone if something else was copied meanwhile.
function clearClipboardLater(token: string, seconds: number) {
  const script = `
    Start-Sleep -Seconds $env:WIN_CLIAUTH_CLEAR_AFTER
    if ("$(Get-Clipboard -Raw)".Trim() -eq $env:WIN_CLIAUTH_TOKEN) {
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.Clipboard]::Clear()
    }`;
  spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-STA', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...powershellEnv(), WIN_CLIAUTH_TOKEN: token, WIN_CLIAUTH_CLEAR_AFTER: String(seconds) },
  }).unref();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readMaFile(path: string): Promise<string> {
  const maFile = JSON.parse(await readFile(path, 'utf8'));
  if (!maFile?.shared_secret)
    throw new Error('No shared_secret in maFile (if it is encrypted, decrypt it first).');
  return maFile.shared_secret;
}

export function countdown(code: string, msLeft: number, period: number) {
  const width = 20;
  const filled = Math.round((msLeft / (period * 1000)) * width);
  return `${code}  ${'█'.repeat(filled)}${'░'.repeat(width - filled)} ${String(Math.ceil(msLeft / 1000)).padStart(2)}s`;
}

type GetOptions = { name: string; steam?: boolean; clipboard?: boolean; clear?: number; sync?: boolean; watch?: boolean };

export async function getAuth({ name, steam, clipboard, clear = 30, sync, watch }: GetOptions) {
  if (watch && !process.stdout.isTTY) throw new Error('--watch needs a terminal.');
  const objAuth = await decrypt();
  const found = findName(Object.keys(objAuth), name);
  if ('error' in found) {
    console.error(found.error);
    process.exitCode = 1;
    return;
  }
  const entry = parseEntry(objAuth[found.name]);
  const copy = async (token: string) => {
    await copyToClipboard(token);
    if (clear > 0) clearClipboardLater(token, clear);
  };

  if (entry.counter !== undefined) {
    // HOTP: each code is used once; the next counter is saved before the code is shown
    if (watch) throw new Error('--watch only works with time-based codes.');
    const token = hotpCode(entry.secret, entry.counter);
    objAuth[found.name] = { secret: entry.secret, counter: entry.counter + 1 };
    await encrypt(objAuth);
    if (clipboard) await copy(token);
    console.info(token);
    return;
  }

  const isSteam = !!(steam || entry.steam);
  const period = codePeriod(entry.secret, isSteam);
  const generate = (ts: number) => (isSteam ? steamCode(entry.secret, ts) : totpCode(entry.secret, ts));
  let timestamp = await syncedNow(isSteam ? 'steam' : 'totp', sync);
  const msLeft = (ts: number) => period * 1000 - (ts % (period * 1000));

  if (watch) {
    // keeps the code on screen, switching to the next one as it changes, until Ctrl+C
    const offset = timestamp - Date.now();
    process.on('SIGINT', () => {
      process.stdout.write('\n');
      process.exit(0);
    });
    console.info(`${found.name} (Ctrl+C to stop)`);
    let last = '';
    for (;;) {
      const now = Date.now() + offset;
      const token = generate(now);
      if (token !== last && clipboard) await copy(token);
      last = token;
      process.stdout.write(`\r${countdown(token, msLeft(now), period)} `);
      await sleep(1000 - (now % 1000) + 10);
    }
  }

  // a code about to expire is of little use: wait for the next one
  if (msLeft(timestamp) <= 2000) {
    const wait = msLeft(timestamp);
    if (process.stderr.isTTY) console.error('Code about to expire, waiting for the next one...');
    await sleep(wait);
    timestamp += wait;
  }

  const token = generate(timestamp);
  if (clipboard) await copy(token);
  // scripts get only the code; people also see how long it stays valid
  console.info(process.stdout.isTTY ? `${token}  (${Math.ceil(msLeft(timestamp) / 1000)}s left)` : token);
}

type AddOptions = {
  name: string;
  secretKey?: string;
  steam?: boolean;
  mafile?: string;
  replace?: boolean;
  hotp?: boolean;
  counter?: number;
};

export async function addAuth({ name, secretKey, steam, mafile, replace, hotp, counter }: AddOptions) {
  let secret: string;
  if (mafile) {
    secret = await readMaFile(mafile);
    steam = true;
  } else if (secretKey) {
    secret = secretKey;
    console.warn('Tip: omit <secret-key> to be prompted for it, so it does not end up in your shell history.');
  } else {
    secret = await readSecret('Secret key: ');
  }
  if (!secret) throw new Error('No secret key given.');
  if (/^steam:\/\//i.test(secret)) steam = true;
  if (isHotpUri(secret) || counter !== undefined) hotp = true;
  if (steam && hotp) throw new Error('Steam Guard codes are time-based; --hotp and --counter do not apply.');
  if (counter !== undefined && (!Number.isSafeInteger(counter) || counter < 0))
    throw new Error('--counter must be a whole number, 0 or more.');

  // validates the secret before storing it
  if (steam) steamSecret(secret);
  else if (hotp) hotpCode(secret, 0);
  else totpCode(secret, Date.now());

  const objAuth = await decrypt();
  if (objAuth[name] && !replace) {
    console.error(`${name} already exists, add --replace to overwrite it.`);
    process.exitCode = 1;
    return;
  }
  if (hotp) objAuth[name] = { secret, counter: counter ?? initialCounter(secret) };
  else objAuth[name] = steam ? { secret, steam: true } : secret;
  await encrypt(objAuth);
  console.info(`${name} added!`);
}

export async function removeAuth({ name }: { name: string }) {
  const objAuth = await decrypt();
  if (!objAuth[name]) return notFound(name);
  delete objAuth[name];
  await encrypt(objAuth);
  console.info(`${name} removed!`);
}

export async function listAuth({ showsecret }: { showsecret?: boolean }) {
  const objAuth = await decrypt();
  if (!showsecret) return console.table(Object.keys(objAuth));
  console.warn('Warning: secret keys are shown in plain text.');
  console.table(Object.fromEntries(Object.entries(objAuth).map(([name, entry]) => [name, parseEntry(entry)])));
}

export async function renameAuth({ oldName, newName }: { oldName: string; newName: string }) {
  const objAuth = await decrypt();
  if (!objAuth[oldName]) return notFound(oldName);
  if (objAuth[newName]) {
    console.error(`${newName} already exists.`);
    process.exitCode = 1;
    return;
  }
  objAuth[newName] = objAuth[oldName];
  delete objAuth[oldName];
  await encrypt(objAuth);
  console.info(`${oldName} renamed to ${newName}.`);
}

export async function exportAuth({ file, force }: { file: string; force?: boolean }) {
  const objAuth = await decrypt();
  const password = await readSecret('Backup password: ');
  if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
  if (process.stdin.isTTY && (await readSecret('Repeat password: ')) !== password)
    throw new Error('Passwords do not match.');
  try {
    await writeFile(file, encryptBackup(objAuth, password), { flag: force ? 'w' : 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw new Error(`${file} already exists, add --force to overwrite it.`, { cause: error });
    throw error;
  }
  console.info(`${Object.keys(objAuth).length} authenticator(s) exported to ${file}.`);
}

export async function importAuth({ file, replace }: { file: string; replace?: boolean }) {
  const text = await readFile(file, 'utf8');
  const backup = decryptBackup(text, await readSecret('Backup password: '));
  const objAuth = await decrypt();
  const added: string[] = [];
  const skipped: string[] = [];
  for (const [name, entry] of Object.entries(backup)) {
    if (objAuth[name] && !replace) skipped.push(name);
    else {
      objAuth[name] = entry;
      added.push(name);
    }
  }
  if (added.length) await encrypt(objAuth);
  console.info(`${added.length} authenticator(s) imported.`);
  if (skipped.length) console.warn(`Skipped (already exist, add --replace to overwrite): ${skipped.join(', ')}`);
}
