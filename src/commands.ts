import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { addAuth, removeAuth, getAuth, listAuth } from './auth';

interface Arguments {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [argName: string]: any;
  _: (string | number)[];
  "--"?: (string | number)[];
}

export function handleCommands(objAuth : Record<string,string>) {
  return yargs(hideBin(process.argv))
    .command(
      'add <name> <secret-key>',
      'add authenticator with given secret key.',
      (y) => y.options({
        'replace' : {
          description: "forces replacement of existing service.",
          require:false
        },
      }),
      (argv: Arguments) => addAuth({ objAuth, svc: argv.name, sk: argv.sk, replace: argv.replace })
    )
    .command(
      'remove <name>',
      'remove given <name> authenticator.',
      { },
      (argv: Arguments) => removeAuth({ objAuth, svc: argv.name })
    )
    .command(
      'get <name>',
      'get token from given service <name> (for steam guard, add --steam)',
      (y) => y.options({
        'steam': {
          description: "get token from steam authenticator.",
          required: false
        },
        'clipboard': {
          description: 'add authenticator code to clipboard',
          required: false
        }
      }),
      (argv: Arguments) => {
        getAuth({ objAuth, svc: argv.name, clipboard: argv.clipboard, steam: argv.steam })
       }
      
    )
    .command(
      'list',
      'Prints out authenticator list.',
      (y) => y.options({
        'showsecret' : {
          description: "Prints out list with secret key",
          require:false
        },
      }),
      (argv: Arguments) => listAuth({ objAuth, showsecret: argv.showsecret})
    )
    .wrap(null)
    .showHelpOnFail(true)
    .demandCommand()
    .recommendCommands()
    .strict()
    .parse();
}
