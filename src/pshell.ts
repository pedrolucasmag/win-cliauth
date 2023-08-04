/* 
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. 
 */

import { spawn } from 'child_process';

function pshell({ cmd }: { cmd: string }): import('child_process').ChildProcess {
  return spawn('powershell.exe', ['/c', cmd], { stdio: 'pipe' });
}

export function encrypt({ str }: { str: string; }) {
  return pshell({
    cmd: `
    $keyPath = "$($env:AppData)/win-cliauth/keys"
    if (!(Test-Path "$keyPath")) { New-Item -Path $keyPath -Force } 
    $secureString = ConvertTo-SecureString '${str}' -AsPlainText -Force
    $encrypted = ConvertFrom-SecureString -SecureString $secureString
    $encrypted > $keyPath
  `
  });
}

export function decrypt() {
  return pshell({
    cmd: `
    $keyPath = "$($env:AppData)/win-cliauth/keys"
    if (!(Test-Path "$keyPath")) { '{}' } 
    else {
      $secureString = Get-Content $keyPath | ConvertTo-SecureString
      $decrypted = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString))
      $decrypted
      }`
  });
}
