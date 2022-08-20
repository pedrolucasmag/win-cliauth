import { exec } from 'child_process';

function pshell({ cmd }: { cmd: string; }) {
  return exec(cmd, { shell: 'powershell.exe' });
}

export function encrypt({ str }: { str: string; }) {
  return pshell({
    cmd: `
    if (!(Test-Path "keys")) { New-Item keys -type "file" } 
    $secureString = ConvertTo-SecureString '${str}' -AsPlainText -Force
    $encrypted = ConvertFrom-SecureString -SecureString $secureString
    $encrypted > keys
  `
  });
}

export function decrypt() {
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
