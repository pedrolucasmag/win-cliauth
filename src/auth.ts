import { spawn } from 'child_process';
import { authenticator } from 'otplib';
import { generateAuthCode } from 'steam-totp';
import { encrypt } from "./pshell";

type AuthOptions = {
  objAuth: Record<string,string>;
  svc?: string;
  clipboard?: boolean;
  steam?: boolean;
  showsecret? : boolean;
  sk?: string;
  replace?: boolean;
};

function getToken({ key, steam }: { key: string; steam?: boolean }): string {
  return steam ? generateAuthCode(key) : authenticator.generate(key);
}

export function getAuth({ objAuth, svc, clipboard, steam }: AuthOptions) {
  const skey = objAuth[`${svc}`];
  if (skey) {
    const token = getToken({ key: skey, steam:steam })
    if (clipboard)
      spawn('clip').stdin.end(token);
    return console.info(token);
  }
  return console.info(`${svc} not found.`);
}

export function addAuth({ objAuth, svc, sk, replace }: AuthOptions) {
  if (objAuth[`${svc}`] && !replace) 
    return console.info(`${svc} already exists, adds --replace to overwrite it.`)
  objAuth[`${svc}`] = String(sk)
  encrypt({ str: JSON.stringify(objAuth) });
  return console.info(`${svc} added!`);
}

export function removeAuth({ objAuth, svc }: AuthOptions) {
  if (!objAuth[`${svc}`]) return console.info(`${svc} not found.`)
  delete objAuth[`${svc}`];
  encrypt({ str: JSON.stringify(objAuth) });
  return console.info(`${svc} removed!`);
}

export function listAuth({ objAuth, showsecret }: AuthOptions) {
  if (showsecret) return console.table(objAuth);
  return console.table(Object.keys(objAuth));
}
