/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { steamCode, steamSecret, totpCode } from './otp';
import { readSecret } from './prompt';
import { decrypt, encrypt, Entry } from './pshell';
import { syncedNow } from './time';

function parseEntry(entry: Entry): { secret: string; steam: boolean } {
  return typeof entry === 'string' ? { secret: entry, steam: false } : { secret: entry.secret, steam: !!entry.steam };
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

async function readMaFile(path: string): Promise<string> {
  const maFile = JSON.parse(await readFile(path, 'utf8'));
  if (!maFile?.shared_secret)
    throw new Error('No shared_secret in maFile (if it is encrypted, decrypt it first, e.g. `steamguard decrypt`).');
  return maFile.shared_secret;
}

type GetOptions = { name: string; steam?: boolean; clipboard?: boolean; sync?: boolean };

export async function getAuth({ name, steam, clipboard, sync }: GetOptions) {
  const objAuth = await decrypt();
  if (!objAuth[name]) return notFound(name);
  const entry = parseEntry(objAuth[name]);
  const token = steam || entry.steam
    ? steamCode(entry.secret, await syncedNow('steam', sync))
    : totpCode(entry.secret, await syncedNow('totp', sync));
  if (clipboard) await copyToClipboard(token);
  console.info(token);
}

type AddOptions = { name: string; secretKey?: string; steam?: boolean; mafile?: string; replace?: boolean };

export async function addAuth({ name, secretKey, steam, mafile, replace }: AddOptions) {
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

  // validates the secret before storing it
  if (steam) steamSecret(secret);
  else totpCode(secret, Date.now());

  const objAuth = await decrypt();
  if (objAuth[name] && !replace) {
    console.error(`${name} already exists, add --replace to overwrite it.`);
    process.exitCode = 1;
    return;
  }
  objAuth[name] = steam ? { secret, steam: true } : secret;
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
