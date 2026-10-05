/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import { spawn } from 'child_process';

export type Entry = string | { secret: string; steam?: boolean };
export type Vault = Record<string, Entry>;

// Secrets never appear in the script text (which is visible in process listings):
// they travel through stdin/stdout as base64-encoded UTF-8.
function pshell({ script, input = '' }: { script: string; input?: string }): Promise<string> {
  const encoded = Buffer.from(`$ErrorActionPreference = 'Stop'\n${script}`, 'utf16le').toString('base64');
  return new Promise((resolve, reject) => {
    const ps = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      { stdio: 'pipe', windowsHide: true }
    );
    let stdout = '';
    let stderr = '';
    ps.stdout.on('data', (chunk) => (stdout += chunk));
    ps.stderr.on('data', (chunk) => (stderr += chunk));
    ps.on('error', (err) => reject(new Error(`Could not start PowerShell: ${err.message}`)));
    ps.on('close', (code) => {
      if (code === 0) return resolve(stdout.trim());
      reject(new Error(stderr.trim() || `PowerShell exited with code ${code}`));
    });
    ps.stdin.end(input);
  });
}

const KEY_PATH = `
$dir = Join-Path $env:AppData 'win-cliauth'
$keyPath = Join-Path $dir 'keys'
`;

export async function encrypt(vault: Vault): Promise<void> {
  await pshell({
    input: Buffer.from(JSON.stringify(vault), 'utf8').toString('base64'),
    script: `${KEY_PATH}
    $plain = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String([Console]::In.ReadToEnd().Trim()))
    $secureString = ConvertTo-SecureString $plain -AsPlainText -Force
    $encrypted = ConvertFrom-SecureString -SecureString $secureString
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    $tmp = "$keyPath.tmp"
    [IO.File]::WriteAllText($tmp, $encrypted)
    if (Test-Path $keyPath) { [IO.File]::Replace($tmp, $keyPath, "$keyPath.bak") }
    else { [IO.File]::Move($tmp, $keyPath) }
    `,
  });
}

export async function decrypt(): Promise<Vault> {
  const output = await pshell({
    script: `${KEY_PATH}
    if (Test-Path $keyPath) {
      $secureString = (Get-Content $keyPath -Raw).Trim() | ConvertTo-SecureString
      $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
      try { $decrypted = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
      finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
      [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($decrypted))
    }
    `,
  });
  // null prototype: names like "toString" or "__proto__" are plain keys, not inherited properties
  const vault: Vault = Object.create(null);
  if (!output) return vault;
  try {
    return Object.assign(vault, JSON.parse(Buffer.from(output, 'base64').toString('utf8')));
  } catch {
    throw new Error('The key file is corrupted (a backup may exist at %AppData%\\win-cliauth\\keys.bak).');
  }
}
