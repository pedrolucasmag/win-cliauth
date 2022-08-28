"use strict";
/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const child_process_1 = require("child_process");
function pshell({ cmd }) {
    return (0, child_process_1.exec)(cmd, { shell: 'powershell.exe' });
}
function encrypt({ str }) {
    return pshell({
        cmd: `
    if (!(Test-Path "keys")) { New-Item keys -type "file" } 
    $secureString = ConvertTo-SecureString '${str}' -AsPlainText -Force
    $encrypted = ConvertFrom-SecureString -SecureString $secureString
    $encrypted > keys
  `
    });
}
exports.encrypt = encrypt;
function decrypt() {
    return pshell({
        cmd: `
    if (!(Test-Path "keys")) { '{}' } 
    else {
      $secureString = Get-Content keys | ConvertTo-SecureString
      $decrypted = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString))
      $decrypted
      }`
    });
}
exports.decrypt = decrypt;
