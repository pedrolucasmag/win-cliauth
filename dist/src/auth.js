"use strict";
/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuth = exports.removeAuth = exports.addAuth = exports.getAuth = void 0;
const child_process_1 = require("child_process");
const otplib_1 = require("otplib");
const steam_totp_1 = require("steam-totp");
const pshell_1 = require("./pshell");
function getToken({ key, steam }) {
    return steam ? (0, steam_totp_1.generateAuthCode)(key) : otplib_1.authenticator.generate(key);
}
function getAuth({ objAuth, svc, clipboard, steam }) {
    const skey = objAuth[`${svc}`];
    if (skey) {
        const token = getToken({ key: skey, steam: steam });
        if (clipboard)
            (0, child_process_1.spawn)('clip').stdin.end(token);
        return console.info(token);
    }
    return console.info(`${svc} not found.`);
}
exports.getAuth = getAuth;
function addAuth({ objAuth, svc, sk, replace }) {
    if (objAuth[`${svc}`] && !replace)
        return console.info(`${svc} already exists, adds --replace to overwrite it.`);
    objAuth[`${svc}`] = String(sk);
    (0, pshell_1.encrypt)({ str: JSON.stringify(objAuth) });
    return console.info(`${svc} added!`);
}
exports.addAuth = addAuth;
function removeAuth({ objAuth, svc }) {
    if (!objAuth[`${svc}`])
        return console.info(`${svc} not found.`);
    delete objAuth[`${svc}`];
    (0, pshell_1.encrypt)({ str: JSON.stringify(objAuth) });
    return console.info(`${svc} removed!`);
}
exports.removeAuth = removeAuth;
function listAuth({ objAuth, showsecret }) {
    return showsecret ? console.table(objAuth) : console.table(Object.keys(objAuth));
}
exports.listAuth = listAuth;
