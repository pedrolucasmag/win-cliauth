import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addAuth, removeAuth, getAuth, listAuth } from './auth';

export function handleCommands({ svcs }: { svcs:Object; }) {
  return yargs(hideBin(process.argv))
    .command(
      'add <name> <sk>',
      'add authenticator with given secret key.',
      () => { },
      (argv: any) => addAuth({ svcs, svc: argv.name, sk: argv.sk })
    )
    .command(
      'remove <name>',
      'remove given <name> authenticator.',
      () => { },
      (argv: any) => removeAuth({ svcs, svc: argv.name })
    )
    .command(
      'get <name>',
      'get token from given service <name> (for steam guard, add --steam)',
      (y) => y.options({
        'steam': {
          description: "handle steam authenticator",
          required: false
        },
        'clipboard': {
          description: 'add authenticator code to clipboard',
          required: false
        }
      }),
      (argv: any) => {
        getAuth({ svcs, svc: argv.name, clipboard: argv.clipboard, steam: argv.steam })
       }
      
    )
    .command(
      'list',
      'Prints out authenticator list.',
      () => { },
      () => listAuth({ svcs })
    )
    .wrap(null)
    .showHelpOnFail(true)
    .demandCommand()
    .recommendCommands()
    .strict()
    .parse();
}
