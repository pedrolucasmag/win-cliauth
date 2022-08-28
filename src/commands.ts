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
      'adds authenticator with given secret key.',
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
      'removes the given <name> authenticator.',
      { },
      (argv: Arguments) => removeAuth({ objAuth, svc: argv.name })
    )
    .command(
      'get <name>',
      'gets the token from service <name> (for steam guard, add --steam)',
      (y) => y.options({
        'steam': {
          description: "gets token from steam authenticator.",
          required: false
        },
        'clipboard': {
          description: 'adds authenticator code to clipboard',
          required: false
        }
      }),
      (argv: Arguments) => {
        getAuth({ objAuth, svc: argv.name, clipboard: argv.clipboard, steam: argv.steam })
       }
      
    )
    .command(
      'list',
      'Prints out the list of authenticators.',
      (y) => y.options({
        'showsecret' : {
          description: "Prints out the list with secret keys",
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
