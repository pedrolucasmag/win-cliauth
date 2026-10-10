/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { Vault } from './pshell';

// Password-protected export of the vault: scrypt-derived key, AES-256-GCM.
const FORMAT = 'win-cliauth-backup';
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

type Backup = {
  format: typeof FORMAT;
  version: 1;
  kdf: { name: 'scrypt'; N: number; r: number; p: number; salt: string };
  iv: string;
  tag: string;
  data: string;
};

function deriveKey(password: string, salt: Buffer, { N, r, p }: { N: number; r: number; p: number }) {
  return scryptSync(password.normalize('NFC'), salt, 32, { N, r, p, maxmem: SCRYPT.maxmem });
}

export function encryptBackup(vault: Vault, password: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(password, salt, SCRYPT), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(vault), 'utf8'), cipher.final()]);
  const backup: Backup = {
    format: FORMAT,
    version: 1,
    kdf: { name: 'scrypt', N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, salt: salt.toString('base64') },
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: data.toString('base64'),
  };
  return JSON.stringify(backup, null, 2);
}

export function decryptBackup(text: string, password: string): Vault {
  let backup: Backup;
  try {
    backup = JSON.parse(text);
  } catch {
    throw new Error('Not a win-cliauth backup file.');
  }
  if (backup?.format !== FORMAT || backup.version !== 1 || backup.kdf?.name !== 'scrypt')
    throw new Error('Not a win-cliauth backup file (or made by a newer version).');
  const key = deriveKey(password, Buffer.from(backup.kdf.salt, 'base64'), backup.kdf);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(backup.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(backup.tag, 'base64'));
  let json: string;
  try {
    json = Buffer.concat([decipher.update(Buffer.from(backup.data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Wrong password, or the backup file is damaged.');
  }
  return Object.assign(Object.create(null), JSON.parse(json));
}
