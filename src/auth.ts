import { spawn } from 'child_process';
import { authenticator } from 'otplib';
import { generateAuthCode } from 'steam-totp';
import { encrypt } from "./pshell";

type AuthOptions = {
  svcs: any;
  svc?: string;
  clipboard?: boolean;
  steam?: boolean;
  sk?: number;
};

function getToken({ key }: { key: string; }): string {
  return authenticator.generate(key);
}

function getSteamToken({ key }: { key: string; }): string {
  return generateAuthCode(key);
}

export function getAuth({ svcs, svc, clipboard, steam }: AuthOptions) {
  if (!svcs[svc!])
    return console.info(`${svc} not found.`);
  const token = steam ? getSteamToken({ key: svcs[svc!] }) : getToken({ key: svcs[svc!] });
  if (clipboard)
    spawn('clip').stdin.end(token);
  return console.info(token);
}

export function addAuth({ svcs, svc, sk }: AuthOptions) {
  svcs[svc!] = sk;
  encrypt({ str: JSON.stringify(svcs) });
  return console.info(`${svc} added!`);
}

export function removeAuth({ svcs, svc }: AuthOptions) {
  delete svcs[svc!];
  encrypt({ str: JSON.stringify(svcs) });
  return console.info(`${svc} removed!`);
}

export function listAuth({ svcs }: AuthOptions) {
  return console.table(Object.keys(svcs));
}
