/*
Copyright (c) <2022>, <Pedro Lucas Magalhães de Oliveira>
All rights reserved.

This source code is licensed under the BSD-style license found in the
LICENSE file in the root directory of this source tree.
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addAuth, removeAuth, getAuth, listAuth, renameAuth, exportAuth, importAuth } from './auth';

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
      'gets the token from service <name> (a unique prefix of the name is enough)',
      (y) => y
        .positional('name', { type: 'string', demandOption: true })
        .options({
          'steam': { type: 'boolean', description: "gets token from steam authenticator." },
          'clipboard': { type: 'boolean', description: 'adds authenticator code to clipboard' },
          'clear': { type: 'number', default: 30, description: 'seconds before the copied code is cleared from the clipboard (0 keeps it)' },
          'sync': { type: 'boolean', description: 'forces a time re-sync instead of using the cached offset' },
          'watch': { type: 'boolean', description: 'keeps the code on screen with a countdown, updating it until Ctrl+C' },
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
    .command(
      'rename <old-name> <new-name>',
      'renames an authenticator.',
      (y) => y
        .positional('old-name', { type: 'string', demandOption: true })
        .positional('new-name', { type: 'string', demandOption: true }),
      (argv) => renameAuth(argv)
    )
    .command(
      'export <file>',
      'saves all authenticators to a password-protected backup file.',
      (y) => y
        .positional('file', { type: 'string', demandOption: true })
        .options({
          'force': { type: 'boolean', description: 'overwrites the file if it exists.' },
        }),
      (argv) => exportAuth(argv)
    )
    .command(
      'import <file>',
      'adds the authenticators from a backup file made with export.',
      (y) => y
        .positional('file', { type: 'string', demandOption: true })
        .options({
          'replace': { type: 'boolean', description: 'overwrites authenticators that already exist.' },
        }),
      (argv) => importAuth(argv)
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
