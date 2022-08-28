"use strict";
/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommands = void 0;
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const auth_1 = require("./auth");
function handleCommands(objAuth) {
    return (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .command('add <name> <secret-key>', 'adds authenticator with given secret key.', (y) => y.options({
        'replace': {
            description: "forces replacement of existing service.",
            require: false
        },
    }), (argv) => (0, auth_1.addAuth)({ objAuth, svc: argv.name, sk: argv.sk, replace: argv.replace }))
        .command('remove <name>', 'removes the given <name> authenticator.', {}, (argv) => (0, auth_1.removeAuth)({ objAuth, svc: argv.name }))
        .command('get <name>', 'gets the token from service <name> (for steam guard, add --steam)', (y) => y.options({
        'steam': {
            description: "gets token from steam authenticator.",
            required: false
        },
        'clipboard': {
            description: 'adds authenticator code to clipboard',
            required: false
        }
    }), (argv) => {
        (0, auth_1.getAuth)({ objAuth, svc: argv.name, clipboard: argv.clipboard, steam: argv.steam });
    })
        .command('list', 'Prints out the list of authenticators.', (y) => y.options({
        'showsecret': {
            description: "Prints out the list with secret keys",
            require: false
        },
    }), (argv) => (0, auth_1.listAuth)({ objAuth, showsecret: argv.showsecret }))
        .wrap(null)
        .showHelpOnFail(true)
        .demandCommand()
        .recommendCommands()
        .strict()
        .parse();
}
exports.handleCommands = handleCommands;
