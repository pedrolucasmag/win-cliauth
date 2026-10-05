import { strict as assert } from 'assert';
import { test } from 'node:test';
import { powershellEnv, readableError } from '../src/pshell';

test('drops PowerShell 7 module path whatever its casing', () => {
  const env = powershellEnv({ PSModulePath: 'C:\\pwsh\\Modules', psmodulepath: 'x', PATH: 'C:\\bin' });
  assert.deepEqual(env, { PATH: 'C:\\bin' });
});

test('turns CLIXML error output into plain text', () => {
  const clixml = '#< CLIXML\r\n<Objs Version="1.1.0.1" xmlns="http://schemas.microsoft.com/powershell/2004/04">'
    + '<Obj S="progress" RefId="0"><TN RefId="0"><T>System.Management.Automation.PSCustomObject</T></TN></Obj>'
    + '<S S="Error">ConvertTo-SecureString : the module &apos;X&apos; could not be loaded._x000D__x000A_</S>'
    + '<S S="Error">At line:7 char:21_x000D__x000A_</S></Objs>';
  assert.equal(readableError(clixml), "ConvertTo-SecureString : the module 'X' could not be loaded.\nAt line:7 char:21");
  assert.equal(readableError('plain error'), 'plain error');
});
