/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addAuth, removeAuth, getAuth, listAuth } from './auth';

export async function handleCommands() {
  await yargs(hideBin(process.argv))
    .scriptName("win-cliauth")
    .command(
      'add <name> [secret-key]',
      'adds authenticator with given secret key (prompts for it when omitted).',
      (y) => y
        .positional('name', { type: 'string', demandOption: true })
        .positional('secret-key', { type: 'string', description: 'base32 secret, otpauth:// URI, or Steam shared_secret' })
        .options({
          'replace': { type: 'boolean', description: "forces replacement of existing service." },
          'steam': { type: 'boolean', description: "stores it as a Steam Guard authenticator." },
          'mafile': { type: 'string', description: "imports the Steam shared_secret from a .maFile." },
        }),
      (argv) => addAuth(argv)
    )
    .command(
      'remove <name>',
      'removes the given <name> authenticator.',
      (y) => y.positional('name', { type: 'string', demandOption: true }),
      (argv) => removeAuth(argv)
    )
    .command(
      'get <name>',
      'gets the token from service <name>',
      (y) => y
        .positional('name', { type: 'string', demandOption: true })
        .options({
          'steam': { type: 'boolean', description: "gets token from steam authenticator." },
          'clipboard': { type: 'boolean', description: 'adds authenticator code to clipboard' },
          'sync': { type: 'boolean', description: 'forces a time re-sync instead of using the cached offset' },
        }),
      (argv) => getAuth(argv)
    )
    .command(
      'list',
      'Prints out the list of authenticators.',
      (y) => y.options({
        'showsecret': { type: 'boolean', description: "Prints out the list with secret keys" },
      }),
      (argv) => listAuth(argv)
    )
    .wrap(null)
    .demandCommand()
    .recommendCommands()
    .strict()
    .fail((msg, err, y) => {
      if (err) throw err;
      y.showHelp();
      console.error(`\n${msg}`);
      process.exit(1);
    })
    .parseAsync();
}
