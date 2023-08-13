/* 
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree. 
 */

import { spawn } from 'child_process';
import { TOTP } from 'otpauth';
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

async function synchronizeTime(): Promise<number> {
  try {
    const response = await fetch('http://www.google.com');
    const responseHeaders = response.headers;
    const headerDate = responseHeaders.get('date');
    const serverTime = headerDate ? Date.parse(headerDate) : Date.now();
    const localTime = Date.now();
    const timeDifference = serverTime - localTime;
    return Date.now() + timeDifference;
  } catch (error) {
    console.error('Time synchronization error:', error);
    throw error;
  }
}

async function getTOTP(key: string): Promise<string> {
  const auth = new TOTP({ secret: key, digits: 6, period: 30 });
  const timestamp = await synchronizeTime();
  return auth.generate({ timestamp });
}

function getToken({ key, steam }: { key: string; steam?: boolean }): Promise<string> | string {
  return steam ? generateAuthCode(key) : getTOTP(key).then((code) => code);
}

export async function getAuth({ objAuth, svc, clipboard, steam }: AuthOptions) {
  const skey = objAuth[`${svc}`];
  if (skey) {
    const token = await getToken({ key: skey, steam:steam })
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
  return showsecret ? console.table(objAuth) : console.table(Object.keys(objAuth));
}
